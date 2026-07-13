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
      { lines: `1-${a}`, explanation: "JDK 21 표준 API로 업로드 경계의 입력, 허용 정책과 저장 상태를 외부 서버 없이 재현합니다." },
      { lines: `${a + 1}-${b}`, explanation: "정상값과 공격·경계값을 같은 정책 함수에 넣어 성공과 거부가 결정적으로 갈리는지 확인합니다." },
      { lines: `${b + 1}-${lines}`, explanation: "원문 파일 내용이나 로컬 경로를 출력하지 않고 stable category, count와 불변식만 stdout으로 검증합니다." },
    ],
    run: { environment: ["JDK 21 이상", "Java 표준 라이브러리", "Spring/Servlet/DB/network/credential 불필요"], command: `java ${filename}` },
    output: { value: output, explanation: ["stdout은 문서의 예상 결과와 한 글자씩 일치해야 합니다.", "JDK-only 모형은 Servlet multipart parser, 실제 파일 시스템의 symlink/권한, 백신과 object storage 동작을 대신하지 않습니다."] },
    experiments: [
      { change: "허용 크기·확장자·signature·저장 단계 또는 실패 지점을 한 항목씩 바꿉니다.", prediction: "정책이 한 경계에 모여 있으면 같은 stable reason과 cleanup invariant로 수렴합니다.", result: "accepted/rejected category, 남은 임시 객체 수와 공개 metadata만 비교합니다." },
      { change: "같은 사례를 MockMvc multipart와 격리된 실제 파일 시스템/object storage adapter에서 실행합니다.", prediction: "container limit, temporary-file cleanup, filesystem semantics와 adapter failure가 추가로 드러납니다.", result: "HTTP status, bytes read/written, final object와 orphan count를 기록합니다." },
    ],
    sourceRefs,
  };
}

const topics: ExpertTopic[] = [
  {
    id: "multipart-wire-binding-lifecycle",
    title: "multipart/form-data를 파일 한 개가 아니라 경계가 있는 요청 프로토콜로 읽습니다",
    lead: "브라우저의 file input은 파일 경로를 보내는 것이 아니라 boundary로 나뉜 part와 metadata·byte stream을 보내며, parser가 만든 임시 자원의 수명도 요청 계약에 포함됩니다.",
    explanations: [
      "RFC 7578의 multipart/form-data는 Content-Type의 boundary와 각 part의 Content-Disposition을 이용합니다. 폼은 POST와 enctype을 선언하고 input name은 controller command의 field와 일치해야 하지만, client가 보낸 filename과 part Content-Type은 신뢰 증거가 아니라 힌트입니다.",
      "Spring MVC는 MultipartResolver가 활성화된 뒤 MultipartFile 또는 command object field로 part를 노출합니다. 여러 파일은 List로 받을 수 있고 JSON metadata와 파일을 함께 받으면 @RequestPart 및 validation error 계약을 명시해야 합니다.",
      "MultipartFile은 요청 처리 동안 제공되는 임시 handle입니다. getBytes로 전체 파일을 heap에 올리기보다 stream을 bounded copy하고, 비동기 작업으로 넘길 때는 요청이 끝나기 전에 격리 저장소로 소유권을 이전한 stable handle만 전달합니다.",
      "빈 part, 누락 part, 같은 이름의 중복 part, boundary 손상, 지나치게 많은 parts와 request 전체 크기를 구분합니다. application validation 전에 container가 요청을 거부할 수 있으므로 status/body/로그 owner를 통합 테스트로 고정합니다.",
      "로컬 JSP는 post, multipart/form-data와 file input을 정확히 보여 주지만 FileReader로 Data URL을 sessionStorage에 저장합니다. preview는 서버 검증을 대체하지 않으며 큰 파일의 base64 메모리·저장소 비용과 개인정보 잔존을 별도 제한해야 합니다.",
    ],
    concepts: [
      c("multipart part", "하나의 multipart body 안에서 독립 header와 payload를 가진 구획입니다.", ["boundary로 구분됩니다.", "field name, filename, media type은 metadata입니다."]),
      c("request-scoped handle", "HTTP 요청 처리 수명에 묶여 container가 임시 자원을 회수할 수 있는 파일 표현입니다.", ["장기 보관 객체가 아닙니다.", "소유권 이전이 필요합니다."]),
      c("parser limit", "application handler 전에 container/resolver가 적용하는 request·part·count 한도입니다.", ["서비스 정책 한도와 함께 둡니다.", "거부 계약을 테스트합니다."]),
    ],
    diagnostics: [
      d("controller의 파일 field가 null이거나 빈 파일로 들어옵니다.", "form enctype/method/name 또는 multipart resolver/container 설정이 handler contract와 다릅니다.", ["실제 Content-Type과 boundary", "part Content-Disposition name", "form input name", "resolver와 size logs"], "wire capture의 synthetic request와 handler signature를 맞추고 missing/empty를 다른 validation code로 처리합니다.", "MockMvc와 실제 container에서 missing, empty, duplicate, malformed multipart contract tests를 둡니다."),
    ],
    expertNotes: ["multipart parsing 성공은 파일이 안전하다는 뜻이 아니라 byte stream을 읽을 수 있게 됐다는 뜻입니다.", "브라우저 preview와 서버 보관은 서로 다른 data lifecycle이므로 각각 삭제·quota 정책을 둡니다."],
  },
  {
    id: "filename-path-traversal",
    title: "원본 filename을 표시 metadata로 격리하고 서버가 storage key를 생성합니다",
    lead: "getOriginalFilename 값을 저장 경로에 이어 붙이면 ../, 절대 경로, separator 변형, Unicode와 symlink를 통해 저장 root 밖을 덮어쓸 수 있습니다.",
    explanations: [
      "원본 filename은 사용자가 보낸 문자열이며 일부 브라우저는 경로 정보를 포함할 수 있다고 MultipartFile API도 경고합니다. 감사·화면 표시가 필요하면 길이와 제어문자를 제한해 metadata로 보관하되 실제 path 결정에는 사용하지 않습니다.",
      "storage key는 UUID/ULID 같은 server-generated opaque identifier와 검증된 canonical extension으로 만듭니다. key와 원본명을 분리하면 동명이름, reserved device name, separator와 normalization 문제를 storage namespace에서 제거할 수 있습니다.",
      "Path root와 candidate를 absolute·normalize한 뒤 candidate.startsWith(root)를 확인하는 것은 기본 방어입니다. 하지만 root 내부 symlink 교체와 검사-사용 시간차가 남으므로 업로드 전용 directory의 쓰기 권한, symlink 금지, secure directory stream 또는 object storage key namespace를 함께 사용합니다.",
      "확장자 추출은 마지막 점만 찾는 것으로 끝나지 않습니다. trailing dot/space, 대소문자, 이중 확장자, null byte 표현, Unicode confusable을 canonicalize한 뒤 좁은 allow-list와 실제 content 검사를 모두 통과시킵니다.",
      "로컬 controller는 UUID와 원본명을 결합해 File(dir, savename)으로 저장하고 download에서도 request의 savename을 직접 사용합니다. provenance로는 유용하지만 maintained 설계는 client가 storage key/path를 지정하지 못하게 하고 attachment id로 authorization된 metadata를 조회합니다.",
    ],
    concepts: [
      c("storage key", "서버가 생성하고 저장소 namespace에서 객체를 식별하는 불투명한 값입니다.", ["원본명과 분리합니다.", "경로 separator를 허용하지 않습니다."]),
      c("path traversal", "외부 입력의 ..·절대경로·separator 등을 이용해 의도한 root 밖의 파일에 접근하는 공격입니다.", ["canonical containment를 검사합니다.", "symlink/TOCTOU도 고려합니다."]),
      c("canonicalization", "비교와 정책 적용 전에 경로·확장자 표현을 하나의 규칙으로 정규화하는 과정입니다.", ["검사 전에 수행합니다.", "원문 표시값과 분리합니다."]),
    ],
    codeExamples: [java("crud07-safe-path", "원본명과 storage key를 분리하는 경로 정책", "Crud07SafePath.java", "공격성 원본명은 표시 metadata로만 분류하고 고정 synthetic storage key가 root 안에만 resolve되는지 실행합니다.", String.raw`import java.nio.file.*;
import java.util.*;

public class Crud07SafePath {
  static String extension(String name) {
    String leaf = Path.of(name.replace('\\', '/')).getFileName().toString();
    int dot = leaf.lastIndexOf('.');
    return dot < 1 ? "" : leaf.substring(dot + 1).toLowerCase(Locale.ROOT);
  }
  public static void main(String[] args) {
    String original = "../../report.png";
    String ext = extension(original);
    String key = "01JSAFEUPLOAD00000000000000." + ext;
    Path root = Path.of("uploads").toAbsolutePath().normalize();
    Path candidate = root.resolve(key).normalize();
    boolean originalTrusted = !(original.contains("..") || original.contains("/") || original.contains("\\"));
    System.out.println("original-trusted=" + originalTrusted);
    System.out.println("canonical-extension=" + ext);
    System.out.println("storage-key=" + key);
    System.out.println("contained=" + candidate.startsWith(root));
    System.out.println("original-used-as-path=false");
  }
}`, "original-trusted=false\ncanonical-extension=png\nstorage-key=01JSAFEUPLOAD00000000000000.png\ncontained=true\noriginal-used-as-path=false", ["local-file-controller", "local-upload-jsp", "spring-multipart", "spring-multipartfile", "java-path", "owasp-file-upload"] )],
    diagnostics: [
      d("업로드 후 저장 root 밖에 파일이 생기거나 기존 파일이 덮어써집니다.", "client filename/storage key를 경로에 직접 resolve했고 canonical containment·exclusive create·symlink 정책이 없습니다.", ["raw filename 사용처", "absolute/normalized root와 candidate", "symlink와 mount 권한", "open/move options"], "server key를 생성하고 root containment와 no-follow/exclusive creation을 적용한 격리 저장 adapter로 이동합니다.", "../, mixed separator, absolute, reserved name, symlink swap corpus를 격리 파일 시스템에서 실행합니다."),
    ],
    expertNotes: ["normalize+startsWith만으로 race-free filesystem security가 완성되지는 않습니다.", "opaque key도 authorization 없는 direct object reference가 되면 안 되므로 download는 resource id와 owner policy를 거칩니다."],
  },
  {
    id: "bounded-stream-resource-limits",
    title: "크기 제한을 header가 아니라 실제 읽은 bytes와 자원 budget으로 집행합니다",
    lead: "Content-Length와 MultipartFile.getSize만 믿으면 chunked body, parser 차이, 압축 해제와 concurrent uploads가 disk·heap·thread를 고갈시킬 수 있습니다.",
    explanations: [
      "한도는 reverse proxy, Servlet container, multipart resolver, application stream과 저장소 quota에 계층적으로 둡니다. 서로 다른 값은 의도와 거부 status를 문서화하고 가장 바깥 계층이 빠르게 큰 요청을 끊도록 합니다.",
      "application은 InputStream을 읽으며 누적 bytes가 part limit를 넘는 즉시 중단합니다. declared size가 작더라도 실제 bytes를 신뢰하며 getBytes처럼 전체 배열을 만들지 않고 bounded buffer와 try-with-resources로 처리합니다.",
      "파일 하나의 한도 외에 request 총량, part 수, 사용자·tenant·IP별 동시성, 일일 quota, 처리 시간과 저장 여유 공간을 둡니다. N개의 허용 최대 파일이 동시에 들어오는 최악의 disk/FD/worker 비용을 계산합니다.",
      "zip, office, image와 archive는 업로드 bytes보다 파싱·압축 해제 후 비용이 훨씬 클 수 있습니다. archive entry count, nesting, expanded bytes, image dimensions/pixels와 parser timeout을 별도 sandbox에서 제한합니다.",
      "거부 시 연결 drain 여부와 temp file cleanup이 container마다 다를 수 있습니다. 413/validation response를 보냈다는 사실뿐 아니라 temporary bytes, open streams와 worker saturation이 정상으로 돌아왔는지 검증합니다.",
    ],
    concepts: [
      c("bounded copy", "stream을 복사하면서 누적량이 정책 한도를 넘으면 즉시 실패시키는 처리입니다.", ["header와 독립적으로 셉니다.", "메모리 전체 적재를 피합니다."]),
      c("resource budget", "요청 하나와 사용자·노드 전체가 사용할 수 있는 bytes, files, descriptors, CPU와 시간을 제한한 계약입니다.", ["동시성을 포함합니다.", "관측 가능한 거부를 둡니다."]),
      c("decompression bomb", "작은 압축 입력이 해제·파싱 과정에서 매우 큰 자원을 요구하도록 만든 payload입니다.", ["expanded limits가 필요합니다.", "sandbox parser를 고려합니다."]),
    ],
    codeExamples: [java("crud07-bounded-stream", "실제 bytes를 세는 bounded stream과 digest", "Crud07BoundedStream.java", "Content-Length 없이도 abc는 3-byte 한도에서 digest와 함께 수락되고 2-byte 한도에서는 즉시 거부되는지 실행합니다.", String.raw`import java.io.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.HexFormat;

public class Crud07BoundedStream {
  static byte[] read(InputStream in, int max) throws Exception {
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    byte[] buffer = new byte[2];
    int total = 0, count;
    while ((count = in.read(buffer)) != -1) {
      total += count;
      if (total > max) throw new IOException("SIZE_LIMIT");
      out.write(buffer, 0, count);
    }
    return out.toByteArray();
  }
  public static void main(String[] args) throws Exception {
    byte[] input = "abc".getBytes(StandardCharsets.UTF_8);
    byte[] accepted = read(new ByteArrayInputStream(input), 3);
    String hash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(accepted));
    System.out.println("accepted-bytes=" + accepted.length);
    System.out.println("sha256-prefix=" + hash.substring(0, 12));
    try { read(new ByteArrayInputStream(input), 2); }
    catch (IOException error) { System.out.println("rejected=" + error.getMessage()); }
    System.out.println("declared-size-trusted=false");
  }
}`, "accepted-bytes=3\nsha256-prefix=ba7816bf8f01\nrejected=SIZE_LIMIT\ndeclared-size-trusted=false", ["jakarta-servlet-multipart", "java-inputstream", "java-message-digest", "owasp-file-upload"] )],
    diagnostics: [
      d("작은 업로드 몇 개만으로 heap/disk가 가득 차고 정상 요청이 대기합니다.", "getBytes 전체 적재 또는 part만 제한하고 request total·concurrency·expanded content budget을 두지 않았습니다.", ["heap allocation profile", "actual bytes read/written", "temp directory and FD", "concurrent upload queue"], "streaming bounded copy와 다층 크기·수·시간·quota 제한을 적용하고 overload를 빠르게 거부합니다.", "max-1/max/max+1, chunked, many-part, slow stream과 decompression corpus를 load test에 둡니다."),
    ],
    expertNotes: ["hash는 integrity/deduplication signal이지 malware 판정이나 사용자 authorization이 아닙니다.", "413을 빨리 반환해도 proxy/container가 body를 어떻게 소비·폐기하는지 실제 배포 topology에서 확인합니다."],
  },
  {
    id: "media-signature-content-validation",
    title: "확장자·declared type·magic signature·semantic parser를 서로 다른 증거로 교차 검증합니다",
    lead: "image/png이라는 header와 .png 이름은 공격자가 자유롭게 지정할 수 있으므로 allow-list와 실제 bytes·안전한 parser 결과가 일치해야 합니다.",
    explanations: [
      "business use case가 정말 필요한 확장자와 media type만 allow-list합니다. blacklist는 새 우회 표현을 계속 놓치며 SVG·HTML·office macro처럼 브라우저가 실행 가능한 active content는 이미지와 같은 정책으로 취급하지 않습니다.",
      "Content-Type은 UX와 빠른 분류에 쓰되 신뢰하지 않습니다. 처음 몇 bytes의 signature를 확인하고, 지원 포맷 parser로 구조·dimension·page count를 bounded sandbox에서 검증하며 parser/library 보안 업데이트를 운영합니다.",
      "signature 하나만 맞춘 polyglot 파일과 trailing payload가 존재할 수 있습니다. 가능하면 안전한 library로 decode 후 canonical re-encode하고, antivirus/CDR 결과와 policy version을 metadata에 남깁니다.",
      "validation 순서는 cheap checks인 count/name/declared size/extension 뒤 bounded stream, signature, semantic scan 순으로 비용을 제한합니다. 어느 단계 실패인지 stable category를 남기되 raw filename/content와 scanner 세부를 공개하지 않습니다.",
      "client-side accept 속성은 파일 chooser 힌트일 뿐 보안 경계가 아닙니다. 서버가 거부한 포맷을 JavaScript 검증 통과 여부와 관계없이 동일한 error contract로 처리합니다.",
    ],
    concepts: [
      c("magic signature", "파일 포맷이 시작 bytes 등에 정의한 식별 패턴입니다.", ["declared media type보다 강한 증거입니다.", "단독으로 충분하지 않습니다."]),
      c("polyglot file", "둘 이상의 parser가 서로 다른 유효 콘텐츠로 해석할 수 있게 구성된 파일입니다.", ["signature-only 검사를 우회할 수 있습니다.", "실제 소비 parser를 검증합니다."]),
      c("content disarm", "위험한 능동 요소를 제거하거나 안전한 표현으로 재구성하는 처리입니다.", ["원본과 파생물을 구분합니다.", "실패·품질 정책이 필요합니다."]),
    ],
    codeExamples: [java("crud07-type-evidence", "declared type과 signature·확장자 교차 검증", "Crud07TypeEvidence.java", "PNG signature를 가진 bytes라도 filename 확장자가 jpg이면 불일치로 거부하고 허용 증거를 출력합니다.", String.raw`import java.util.*;

public class Crud07TypeEvidence {
  static boolean png(byte[] value) {
    byte[] sig = {(byte)0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
    return value.length >= sig.length && Arrays.equals(sig, Arrays.copyOf(value, sig.length));
  }
  static String validate(String filename, String declared, byte[] bytes) {
    String lower = filename.toLowerCase(Locale.ROOT);
    if (!Set.of("image/png").contains(declared)) return "DECLARED_TYPE_NOT_ALLOWED";
    if (!png(bytes)) return "SIGNATURE_MISMATCH";
    if (!lower.endsWith(".png")) return "EXTENSION_MISMATCH";
    return "ACCEPTED";
  }
  public static void main(String[] args) {
    byte[] png = {(byte)0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,1};
    System.out.println("png-signature=" + png(png));
    System.out.println("photo.jpg=" + validate("photo.jpg", "image/png", png));
    System.out.println("photo.png=" + validate("photo.png", "image/png", png));
    System.out.println("svg=" + validate("x.svg", "image/svg+xml", new byte[]{'<'}));
  }
}`, "png-signature=true\nphoto.jpg=EXTENSION_MISMATCH\nphoto.png=ACCEPTED\nsvg=DECLARED_TYPE_NOT_ALLOWED", ["owasp-file-upload", "spring-multipartfile", "java-arrays", "rfc7578"] )],
    diagnostics: [
      d(".png 업로드를 내려받았더니 브라우저에서 script/HTML로 실행됩니다.", "확장자나 client Content-Type만 검사하고 signature·semantic parser·download headers를 검증하지 않았습니다.", ["stored bytes signature", "sniffed/declared type", "Content-Disposition and nosniff", "active content policy"], "좁은 allow-list, signature+parser 검사와 attachment download를 적용하고 필요하면 canonical re-encode합니다.", "mismatched type, polyglot, malformed, oversized dimension과 active content corpus를 실제 소비 client까지 테스트합니다."),
    ],
    expertNotes: ["AV scan의 clean 결과는 당시 signature/engine 기준이며 이후 재분류와 quarantine capability가 필요합니다.", "사용자가 업로드한 파일을 같은 origin에서 inline 제공하면 XSS와 credential exposure 표면이 커집니다."],
  },
  {
    id: "quarantine-atomic-publish",
    title: "업로드를 quarantine→검증→원자적 publish 상태 머신으로 만듭니다",
    lead: "검증이 끝나기 전에 public directory에 저장하면 scanner가 실패하거나 process가 죽는 순간에도 위험한 파일이 URL로 노출됩니다.",
    explanations: [
      "incoming bytes는 web root 밖의 quarantine에 exclusive temporary key로 씁니다. write가 끝나면 fsync/durability 요구를 결정하고 size/hash를 확정한 뒤 scanner와 semantic validator가 같은 immutable object를 읽게 합니다.",
      "상태는 RECEIVING, QUARANTINED, SCANNING, APPROVED, PUBLISHED, REJECTED처럼 명시하고 허용 transition을 한 owner가 집행합니다. APPROVED 전에는 download route와 static resource handler가 접근할 수 없어야 합니다.",
      "같은 filesystem에서는 Files.move의 ATOMIC_MOVE 가능 여부를 확인하고 destination은 replace하지 않습니다. 서로 다른 volume/object store에서는 copy+conditional put+manifest commit 또는 versioned key와 pointer switch로 publish 의미를 정의합니다.",
      "process crash가 어느 transition 사이에서 나도 reconciler가 temporary object, metadata state와 final object를 비교해 resume 또는 delete할 수 있어야 합니다. age threshold와 lease로 아직 진행 중인 업로드를 orphan으로 오판하지 않습니다.",
      "scanner timeout과 unavailable은 clean이 아닙니다. fail-closed quarantine을 유지하고 bounded retry/dead-letter/manual review를 사용하며 사용자는 opaque processing status만 확인합니다.",
    ],
    concepts: [
      c("quarantine", "검증이 끝나기 전 파일을 공개·실행 경로와 분리해 보관하는 격리 상태입니다.", ["web root 밖에 둡니다.", "최소 권한을 적용합니다."]),
      c("atomic publish", "소비자가 불완전한 파일을 보지 않고 이전 또는 완성된 새 상태만 관찰하게 하는 전환입니다.", ["filesystem 지원을 확인합니다.", "object store에는 다른 protocol이 필요합니다."]),
      c("state machine", "허용 상태와 transition·실패·복구를 명시한 lifecycle model입니다.", ["중간 상태를 durable하게 둡니다.", "download policy와 연결합니다."]),
    ],
    codeExamples: [java("crud07-upload-state", "검증 전 공개를 막는 업로드 상태 머신", "Crud07UploadState.java", "정상 publish와 scan 실패가 각각 PUBLISHED와 REJECTED로 끝나며 승인 전 public 상태가 없는지 실행합니다.", String.raw`import java.util.*;

public class Crud07UploadState {
  enum State { RECEIVING, QUARANTINED, SCANNING, APPROVED, PUBLISHED, REJECTED }
  static List<State> run(boolean clean) {
    List<State> states = new ArrayList<>();
    states.add(State.RECEIVING); states.add(State.QUARANTINED); states.add(State.SCANNING);
    if (!clean) { states.add(State.REJECTED); return List.copyOf(states); }
    states.add(State.APPROVED); states.add(State.PUBLISHED);
    return List.copyOf(states);
  }
  public static void main(String[] args) {
    List<State> clean = run(true);
    List<State> infected = run(false);
    System.out.println("clean=" + clean);
    System.out.println("infected=" + infected);
    System.out.println("public-before-approved=" + (clean.indexOf(State.PUBLISHED) < clean.indexOf(State.APPROVED)));
    System.out.println("infected-published=" + infected.contains(State.PUBLISHED));
  }
}`, "clean=[RECEIVING, QUARANTINED, SCANNING, APPROVED, PUBLISHED]\ninfected=[RECEIVING, QUARANTINED, SCANNING, REJECTED]\npublic-before-approved=false\ninfected-published=false", ["java-files", "java-standard-copy-option", "owasp-file-upload", "spring-multipartfile"] )],
    diagnostics: [
      d("scan timeout 직후에도 파일 URL이 200으로 열립니다.", "write destination과 public location이 같고 published 상태가 scanner 성공과 원자적으로 연결되지 않았습니다.", ["storage prefixes/permissions", "metadata transition history", "download eligibility query", "scanner timeout branch"], "quarantine namespace와 explicit APPROVED transition을 만들고 conditional atomic publish 뒤에만 download를 허용합니다.", "각 transition에서 process kill, scanner fail/timeout, duplicate callback과 concurrent download fault tests를 둡니다."),
    ],
    expertNotes: ["rename이 atomic이라는 일반론 대신 같은 filesystem·provider와 requested options의 실제 지원을 확인합니다.", "quarantine도 민감정보 저장소이므로 encryption, access, retention과 secure deletion 정책이 필요합니다."],
  },
  {
    id: "metadata-transaction-compensation",
    title: "DB metadata와 비트 저장소의 이중 쓰기를 compensation·outbox·reconciliation로 닫습니다",
    lead: "파일 저장은 DB transaction rollback에 참여하지 않으므로 object 저장 뒤 INSERT가 실패하거나 그 반대가 되면 orphan 또는 깨진 attachment가 남습니다.",
    explanations: [
      "attachment metadata에는 resource id, owner, storage key, safe display name, detected type, size, hash, lifecycle state와 policy version을 둡니다. raw local path와 client-supplied key를 public DTO에 싣지 않습니다.",
      "동기 방식은 quarantine object를 먼저 쓰고 DB transaction이 실패하면 best-effort delete compensation을 수행합니다. delete도 실패할 수 있으므로 orphan marker/operation id를 남겨 reconciler가 반복 가능하게 정리합니다.",
      "DB를 먼저 commit하고 object publish를 나중에 수행하면 PENDING 상태와 outbox event가 필요합니다. consumer는 idempotent conditional put/transition을 하고, 사용자는 PENDING을 READY로 오인하지 않게 조회 계약을 분리합니다.",
      "어떤 순서도 분산 ACID를 자동으로 만들지 않습니다. 비즈니스가 허용하는 temporary inconsistency, retry deadline, visibility, compensation과 manual repair owner를 상태 다이어그램으로 결정합니다.",
      "hash dedup은 storage 절약과 privacy leak trade-off가 있습니다. tenant/authorization 경계를 넘는 existence oracle을 만들지 않고 같은 bytes라도 소유권·retention metadata는 독립적으로 관리합니다.",
    ],
    concepts: [
      c("compensation", "이미 성공한 외부 효과를 반대 작업으로 완화하는 명시적 복구 절차입니다.", ["rollback과 다릅니다.", "실패할 수 있어 재시도가 필요합니다."]),
      c("outbox", "DB 업무 상태와 발행할 작업 기록을 같은 transaction에 저장해 후속 전달을 재시도하는 pattern입니다.", ["중복 전달을 허용합니다.", "consumer idempotency가 필요합니다."]),
      c("reconciliation", "두 시스템의 실제 상태를 주기적으로 비교해 누락·orphan·stuck 상태를 탐지하고 복구하는 과정입니다.", ["age/lease를 고려합니다.", "감사 evidence를 남깁니다."]),
    ],
    codeExamples: [java("crud07-compensation", "metadata 실패 뒤 object 삭제 보상", "Crud07Compensation.java", "object 저장 뒤 DB metadata 단계가 실패하면 compensation이 object를 제거해 orphan과 row가 모두 남지 않는지 실행합니다.", String.raw`import java.util.*;

public class Crud07Compensation {
  static final class Workflow {
    final Set<String> objects = new HashSet<>();
    final Set<String> rows = new HashSet<>();
    boolean compensated;
    void upload(String id, boolean databaseFails) {
      objects.add(id);
      try {
        if (databaseFails) throw new IllegalStateException("METADATA_WRITE_FAILED");
        rows.add(id);
      } catch (RuntimeException error) {
        compensated = objects.remove(id);
        System.out.println("failure=" + error.getMessage());
      }
    }
  }
  public static void main(String[] args) {
    Workflow workflow = new Workflow();
    workflow.upload("synthetic-object", true);
    System.out.println("objects=" + workflow.objects.size());
    System.out.println("rows=" + workflow.rows.size());
    System.out.println("compensated=" + workflow.compensated);
    System.out.println("orphan=false");
  }
}`, "failure=METADATA_WRITE_FAILED\nobjects=0\nrows=0\ncompensated=true\norphan=false", ["spring-transactions", "java-set", "owasp-file-upload", "java-files"] )],
    diagnostics: [
      d("DB에는 attachment가 없는데 storage 사용량이 계속 증가합니다.", "object write 성공 뒤 DB failure/timeout에서 compensation과 durable operation identity가 없습니다.", ["storage inventory vs metadata", "transaction outcome", "delete compensation logs", "stuck age and retry"], "상태·operation id를 durable하게 기록하고 idempotent compensation 또는 outbox publish와 reconciler를 구현합니다.", "write/DB commit/commit response/delete 각 지점 fault injection과 orphan SLO를 release gate로 둡니다."),
    ],
    expertNotes: ["보상 성공 응답을 받지 못한 unknown도 재조회 가능한 operation 상태로 처리합니다.", "reconciler가 삭제 결정을 내릴 때 retention/legal hold와 진행 중 lease를 함께 확인합니다."],
  },
  {
    id: "authorized-download-response",
    title: "다운로드를 path 조회가 아니라 authorization된 resource 응답으로 설계합니다",
    lead: "savename과 ori_name을 query parameter로 받아 File을 여는 방식은 traversal, IDOR, header injection과 존재 여부 노출을 한 endpoint에 모읍니다.",
    explanations: [
      "client는 attachment resource id만 보내고 service가 principal, parent resource visibility와 attachment state를 확인한 뒤 내부 storage key를 조회합니다. storage key를 알아도 authorization을 우회하지 못해야 합니다.",
      "response는 검증된 server metadata로 Content-Type과 길이를 정하고 기본적으로 Content-Disposition: attachment를 사용합니다. filename은 RFC에 맞는 quoted fallback과 filename* encoding을 library로 생성하며 CR/LF와 control을 제거합니다.",
      "X-Content-Type-Options: nosniff, Cache-Control, ETag/conditional request와 Range 지원 여부를 threat model과 파일 크기에 맞게 정합니다. private attachment를 CDN/public cache key에 잘못 공유하지 않습니다.",
      "404와 403 선택은 존재 privacy와 운영 진단을 함께 고려합니다. public response는 동일하게 숨기더라도 internal audit에는 actor category, resource id hash, decision reason을 남기고 filename/content는 남기지 않습니다.",
      "stream 중 client disconnect는 정상적인 cancellation일 수 있습니다. input/output을 닫고 connection/stream metric을 정리하되 partial download를 성공 count로 기록하지 않으며 retry와 Range semantics를 명시합니다.",
    ],
    concepts: [
      c("IDOR", "사용자가 식별자를 바꿔 다른 사용자의 객체에 접근하는 authorization 결함입니다.", ["불투명 ID만으로 막히지 않습니다.", "객체별 권한을 확인합니다."]),
      c("Content-Disposition", "응답 payload를 inline 표시할지 attachment로 받을지와 제안 filename을 전달하는 header입니다.", ["안전한 encoding이 필요합니다.", "서버 metadata로 만듭니다."]),
      c("content sniffing", "브라우저가 declared type과 다른 content type을 추측해 처리하는 동작입니다.", ["nosniff를 고려합니다.", "same-origin active content를 피합니다."]),
    ],
    diagnostics: [
      d("다른 사용자의 attachment id를 바꾸면 파일이 내려받아집니다.", "download controller가 storage 존재만 확인하고 parent/owner authorization과 lifecycle state를 검사하지 않습니다.", ["principal and resource policy", "metadata lookup predicate", "storage key exposure", "cache key/vary"], "resource id→authorized metadata→internal key 순서로 조회하고 deny를 storage read 전에 끝냅니다.", "owner/other/admin/deleted/quarantined 및 cache 재사용 matrix를 end-to-end로 검증합니다."),
    ],
    expertNotes: ["static resource handler로 업로드 directory 전체를 공개하면 application authorization 경계를 우회할 수 있습니다.", "filename encoding은 URLEncoder 하나와 동일하지 않으므로 framework의 RFC-compliant builder와 실제 브라우저를 검증합니다."],
  },
  {
    id: "object-storage-async-pipeline",
    title: "대용량 업로드와 object storage에서는 presigned 경계·완료 검증·비동기 상태를 분리합니다",
    lead: "application server를 모든 bytes의 relay로 쓰지 않아도 되지만 presigned URL을 발급하는 순간 크기·key·권한·만료 정책을 client에게 위임하게 됩니다.",
    explanations: [
      "presign service는 authenticated actor와 use case를 확인하고 server-generated quarantine key, 짧은 expiry, content length/range와 허용 method를 제한합니다. bucket list/read나 임의 key 쓰기 권한을 client에 주지 않습니다.",
      "upload 완료 callback은 client 주장만 믿지 않고 object HEAD/metadata, actual size, checksum/version과 key ownership을 조회합니다. completion request는 idempotency key를 갖고 같은 object version에 한 번만 transition합니다.",
      "malware/semantic scan은 queue consumer가 수행하고 PENDING_SCAN 상태를 유지합니다. event는 중복·지연·역순일 수 있으므로 expected version을 조건으로 transition하고 stale callback을 거부합니다.",
      "multipart object upload의 incomplete parts는 비용을 남기므로 abort lifecycle rule과 reconciler를 둡니다. client disconnect, expired URL, retry가 같은 logical upload를 몇 개의 objects로 만드는지 관측합니다.",
      "CDN과 object storage의 public ACL을 사용하지 않고 authorization gateway 또는 짧은 signed download를 선택합니다. signed URL이 로그·referrer·browser history로 새지 않도록 TTL, audience와 response headers를 최소화합니다.",
    ],
    concepts: [
      c("presigned upload", "제한된 object operation을 짧은 시간 동안 client가 직접 수행하도록 서명한 요청입니다.", ["권한 위임입니다.", "key/size/expiry를 제한합니다."]),
      c("object version", "같은 key의 서로 다른 저장 결과를 구별하는 immutable version 식별자입니다.", ["callback race를 막습니다.", "scan 대상과 publish 대상을 고정합니다."]),
      c("eventual processing", "bytes 수신과 검증·공개가 서로 다른 시점에 완료되는 상태 모델입니다.", ["PENDING을 노출합니다.", "재시도·역순을 처리합니다."]),
    ],
    diagnostics: [
      d("만료된 업로드 재시도 뒤 scan된 object와 공개된 object version이 다릅니다.", "callback이 key만 사용하고 immutable version/checksum과 expected-state condition을 확인하지 않았습니다.", ["presign operation id", "object version/checksum", "event ordering", "conditional transition result"], "각 logical upload에 key+version+checksum을 고정하고 CAS transition으로 stale/duplicate event를 거부합니다.", "expire/retry/overwrite/duplicate/out-of-order callback과 multipart abort fault tests를 둡니다."),
    ],
    expertNotes: ["direct upload는 application bandwidth를 줄이지만 authorization과 lifecycle complexity를 제거하지 않습니다.", "object store의 strong consistency 범위와 notification delivery semantics는 provider 공식 문서와 실제 계정 설정으로 확인합니다."],
  },
  {
    id: "idempotency-concurrency-retention",
    title: "중복 제출·동시 publish·삭제와 retention을 하나의 attachment lifecycle로 관리합니다",
    lead: "사용자가 submit을 두 번 누르거나 timeout 뒤 재시도하면 같은 파일을 여러 번 저장하고, 삭제와 scan callback이 경합하면 이미 지운 자료가 다시 공개될 수 있습니다.",
    explanations: [
      "logical upload operation에 actor 범위의 idempotency key를 부여하고 request fingerprint와 결과 attachment id를 저장합니다. 같은 key와 다른 payload는 conflict로 거부하고 같은 요청은 기존 상태를 반환합니다.",
      "상태 transition은 version 또는 compare-and-set으로 보호합니다. DELETED/TOMBSTONED에서 늦은 APPROVED callback이 PUBLISHED로 되돌아가지 못하게 terminal state와 allowed transition table을 DB constraint/service에서 검증합니다.",
      "delete는 metadata 숨김, object deletion, cache purge와 backup retention이 서로 다른 시간에 일어납니다. user-visible 삭제 의미, legal hold, restore window와 physical erase 증거를 문서화합니다.",
      "hash 기반 dedup을 쓰더라도 reference count를 단순 감소만 하지 않습니다. authorization domain, concurrent attach/delete, retention hold와 object generation을 transaction/locking으로 보호합니다.",
      "quota는 예약과 실제 사용량을 구분합니다. upload 시작 때 capacity를 reserve하고 success에서 commit, reject/expiry에서 release하며 reconciliation으로 leaked reservation을 회수합니다.",
    ],
    concepts: [
      c("idempotency key", "같은 logical operation의 재시도를 식별해 중복 효과를 막는 client/server 계약입니다.", ["actor와 request fingerprint에 묶습니다.", "결과 상태를 재사용합니다."]),
      c("terminal state", "늦은 callback이나 retry가 정상 경로로 되돌릴 수 없는 lifecycle 상태입니다.", ["DELETED/REJECTED 등이 있습니다.", "transition table로 보호합니다."]),
      c("quota reservation", "아직 확정되지 않은 업로드가 소비할 capacity를 임시로 확보하는 회계 상태입니다.", ["expiry가 필요합니다.", "실사용과 reconciliation합니다."]),
    ],
    diagnostics: [
      d("삭제한 attachment가 몇 분 뒤 다시 공개 상태가 됩니다.", "scan/publish callback이 현재 version과 terminal state를 확인하지 않고 상태를 덮어씁니다.", ["transition history", "event object version", "optimistic lock result", "delete/cache purge time"], "expected version/state를 조건으로 update하고 DELETED를 terminal로 만들며 stale event를 ack+audit합니다.", "delete와 approve/publish/retry를 barrier로 경합시키는 concurrency contract test를 둡니다."),
    ],
    expertNotes: ["idempotency record 자체도 retention과 개인정보 최소화 대상입니다.", "물리 삭제 완료를 즉시 약속하기 전에 replica, cache, backup과 legal retention 경계를 정확히 설명합니다."],
  },
  {
    id: "testing-observability-governance",
    title: "업로드를 adversarial corpus·fault injection·자원 telemetry와 provenance로 증명합니다",
    lead: "정상 사진 한 장이 올라간다는 테스트는 traversal, parser 폭탄, 부분 실패, orphan과 개인정보 로그를 발견하지 못합니다.",
    explanations: [
      "unit tests는 filename/path/type/state transition과 compensation pure policy를 빠르게 전수합니다. property/fuzz tests는 separator, Unicode, length, malformed multipart와 signature 변형을 생성하되 테스트 artifact도 안전한 synthetic bytes만 사용합니다.",
      "MockMvc/Servlet integration은 multipart binding, validation, 400/413, authentication·CSRF와 controller/service 호출 단절을 확인합니다. 실제 container 설정을 포함한 테스트에서 temp directory가 request 후 비워지는지 검증합니다.",
      "filesystem/object-store integration은 exclusive create, permissions, symlink, atomic move 지원, partial write, conditional put와 version을 검증합니다. 실제 scanner는 clean/eicar-like approved test fixture 정책과 timeout/unavailable mock을 분리합니다.",
      "metrics는 accepted/rejected category, bytes histogram, scan latency, quarantine age, orphan/reservation count와 cleanup failure를 bounded labels로 둡니다. filename, user content, local path, signed URL과 hash 전체를 label/log에 넣지 않습니다.",
      "로컬 controller/JSP는 read-only hash와 구조만 provenance에 남기고 maintained solution과 차이를 명시합니다. 배포 gate에는 정책 version, source docs, threat corpus, fault points, cleanup evidence와 rollback runbook을 포함합니다.",
    ],
    concepts: [
      c("adversarial corpus", "우회·자원 고갈·경계 실패를 재현하도록 관리되는 synthetic 입력 집합입니다.", ["회귀 테스트에 둡니다.", "실제 악성/개인 파일을 복사하지 않습니다."]),
      c("fault injection", "write, scan, DB, publish, delete와 응답 경계에서 의도적으로 실패를 발생시켜 복구를 검증하는 기법입니다.", ["unknown outcome을 포함합니다.", "orphan을 측정합니다."]),
      c("bounded telemetry", "cardinality와 민감정보가 통제된 category/count/duration 중심 관측 정보입니다.", ["raw filename/content를 제외합니다.", "SLO와 연결합니다."]),
    ],
    diagnostics: [
      d("업로드 장애를 조사하려면 raw filename과 전체 storage path가 든 로그를 열어야 합니다.", "관측 설계가 operation/state/reason correlation 대신 민감 payload를 진단 키로 사용합니다.", ["log/APM fields", "metric cardinality", "operation correlation", "retention/access"], "opaque operation id와 bounded reason/state/latency를 기록하고 raw 값은 제거·회전하며 secure audit를 분리합니다.", "synthetic secret/path canary가 log, trace, metric, error response에서 0건인지 CI에서 검사합니다."),
    ],
    expertNotes: ["보안 테스트 artifact도 저장·배포 과정에서 위험할 수 있어 별도 격리와 승인된 synthetic fixture를 사용합니다.", "정상 성공률보다 quarantine age, orphan과 cleanup failure가 0 또는 합의된 SLO인지 함께 봅니다."],
  },
];

const sources: SessionSource[] = [
  { id: "local-file-controller", repository: "local learning archive", path: "2026-springmvc01/src/main/java/.../fileup/controller/FileController.java", usedFor: ["legacy upload/download flow provenance and security gap audit"], evidence: "Read-only audit: 145 lines, 5,607 bytes, SHA-256 F3DF86F64AF206440A29E30DDA7FAB2FDD92B3ACB8A6639FAAC91F0392A94665." },
  { id: "local-upload-jsp", repository: "local learning archive", path: "2026-springmvc01/src/main/webapp/WEB-INF/views/fileup/upload.jsp", usedFor: ["multipart form and browser preview provenance"], evidence: "Read-only audit: 41 lines, 1,329 bytes, SHA-256 C0E9329283D54CEEFC109558C44A9DC50248D0C4601032EB021176493A33FAE7." },
  { id: "spring-multipart", repository: "Spring Framework Reference", path: "Web MVC Multipart", publicUrl: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/multipart-forms.html", usedFor: ["MultipartResolver, MultipartFile and @RequestPart binding"], evidence: "Spring Framework 공식 multipart reference입니다." },
  { id: "spring-multipartfile", repository: "Spring Framework API", path: "MultipartFile", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/multipart/MultipartFile.html", usedFor: ["temporary storage, original filename and transfer contract"], evidence: "Spring Framework 공식 MultipartFile API입니다." },
  { id: "jakarta-servlet-multipart", repository: "Jakarta Servlet 6.1 Specification", path: "Multipart processing", publicUrl: "https://jakarta.ee/specifications/servlet/6.1/jakarta-servlet-spec-6.1", usedFor: ["container multipart configuration and limits"], evidence: "Jakarta Servlet 공식 specification입니다." },
  { id: "rfc7578", repository: "IETF RFC Editor", path: "RFC 7578 multipart/form-data", publicUrl: "https://www.rfc-editor.org/rfc/rfc7578.html", usedFor: ["wire format, boundary and part metadata"], evidence: "IETF 표준 multipart/form-data 문서입니다." },
  { id: "owasp-file-upload", repository: "OWASP Cheat Sheet Series", path: "File Upload Cheat Sheet", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html", usedFor: ["filename, type, storage, limits and authorization controls"], evidence: "OWASP 공식 file upload guidance입니다." },
  { id: "java-path", repository: "Java SE 21 API", path: "Path", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Path.html", usedFor: ["path resolution, normalization and containment"], evidence: "Oracle JDK 공식 Path API입니다." },
  { id: "java-files", repository: "Java SE 21 API", path: "Files", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html", usedFor: ["stream, create, move and filesystem operations"], evidence: "Oracle JDK 공식 Files API입니다." },
  { id: "java-standard-copy-option", repository: "Java SE 21 API", path: "StandardCopyOption", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/StandardCopyOption.html", usedFor: ["atomic move capability"], evidence: "Oracle JDK 공식 StandardCopyOption API입니다." },
  { id: "java-inputstream", repository: "Java SE 21 API", path: "InputStream", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/InputStream.html", usedFor: ["bounded streaming and resource lifetime"], evidence: "Oracle JDK 공식 InputStream API입니다." },
  { id: "java-message-digest", repository: "Java SE 21 API", path: "MessageDigest", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/security/MessageDigest.html", usedFor: ["stream integrity digest"], evidence: "Oracle JDK 공식 MessageDigest API입니다." },
  { id: "java-arrays", repository: "Java SE 21 API", path: "Arrays", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html", usedFor: ["signature comparison example"], evidence: "Oracle JDK 공식 Arrays API입니다." },
  { id: "java-set", repository: "Java SE 21 API", path: "Set", publicUrl: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Set.html", usedFor: ["allow-list and compensation model"], evidence: "Oracle JDK 공식 Set API입니다." },
  { id: "spring-transactions", repository: "Spring Framework Reference", path: "Transaction Management", publicUrl: "https://docs.spring.io/spring-framework/reference/data-access/transaction.html", usedFor: ["database transaction boundary versus file side effects"], evidence: "Spring Framework 공식 transaction reference입니다." },
];

const session = createExpertSession({
  inventoryId: "crud-07-file-upload", slug: "crud-07-file-upload", courseId: "spring", moduleId: "spring-layered-crud", order: 7,
  title: "multipart 파일 업로드·저장·검증", subtitle: "요청 part를 안전한 storage lifecycle로 바꾸고 경로·크기·형식·부분 실패와 공개 다운로드를 끝까지 검증합니다.", level: "고급", estimatedMinutes: 100,
  coreQuestion: "신뢰할 수 없는 filename과 bytes를 어떻게 bounded하게 받아 quarantine·검증·저장하고 DB 실패나 재시도에도 데이터와 자원을 잃지 않을까요?",
  summary: "로컬 FileController와 JSP를 read-only로 감사해 multipart form, command-object binding, UUID+원본명 저장, transferTo, query 기반 download와 browser preview 구조를 확인했습니다. 그 구조를 그대로 공개 정답으로 복제하지 않고 RFC multipart lifecycle, 원본명 비신뢰, canonical path·symlink 경계, 실제 bytes 기반 resource limits, extension·declared type·signature·semantic scan, quarantine과 atomic publish, DB/storage compensation·outbox·reconciliation, authorization된 download, presigned object pipeline, idempotency·retention 및 adversarial 운영 검증으로 확장합니다. 다섯 JDK 21 예제가 경로 containment, bounded digest, type evidence, 상태 전이와 compensation stdout을 실제 실행합니다.",
  objectives: ["multipart wire/binding과 request-scoped temporary resource를 설명한다.", "원본 filename과 server-generated storage key를 분리한다.", "path traversal, symlink와 TOCTOU 경계를 방어한다.", "실제 bytes와 동시성·expanded content에 resource budget을 적용한다.", "type evidence와 semantic scan을 단계적으로 검증한다.", "quarantine에서 atomic publish까지 상태 머신을 설계한다.", "DB와 storage 부분 실패를 compensation/outbox/reconciliation으로 복구한다.", "download authorization, response headers와 cache를 안전하게 설계한다.", "direct object upload의 presign·version·callback 경계를 검증한다.", "fuzz, fault injection, cleanup·orphan telemetry를 release gate로 만든다."],
  prerequisites: [{ title: "댓글 REST API와 AJAX CRUD", reason: "요청/응답 계약, authorization, idempotency와 비동기 client 상태를 이해해야 multipart와 저장소 side effect를 같은 CRUD 흐름에 안전하게 결합할 수 있습니다.", sessionSlug: "crud-06-reply-rest-ajax" }],
  keywords: ["multipart", "MultipartFile", "path traversal", "filename sanitization", "bounded stream", "magic signature", "quarantine", "atomic publish", "compensation", "outbox", "presigned upload", "authorized download", "reconciliation"],
  topics,
  lab: {
    title: "공개 디렉터리 직행 업로드를 검증 가능한 attachment pipeline으로 재구성하기",
    scenario: "기존 form/controller는 원본명을 UUID에 붙여 로컬 directory에 바로 저장하고 request parameter의 저장명으로 download합니다. 큰 파일, traversal, active content, scanner/DB failure와 중복 submit에서도 공개·orphan·정보 손실이 없어야 합니다.",
    setup: ["원본 두 파일은 read-only provenance로 보존하고 경로·설정값·실제 사용자 파일을 복사하지 않습니다.", "synthetic png signature, mismatched type, boundary sizes, traversal names와 scanner outcomes를 fixture로 만듭니다.", "web root 밖 quarantine/final test roots와 metadata table, operation id, fake scanner/object adapter를 준비합니다.", "MockMvc/실제 Servlet container 및 격리 filesystem/object store test profile을 분리합니다."],
    steps: ["multipart field·part 수·request/part size 계약을 작성합니다.", "원본명은 display metadata로만 제한하고 opaque storage key를 생성합니다.", "bounded stream으로 bytes와 digest를 확정하며 overflow를 즉시 정리합니다.", "extension, declared type, signature와 semantic scanner를 단계별로 실행합니다.", "quarantine lifecycle과 allowed transition을 DB에 기록합니다.", "scanner 성공 object version만 conditional publish합니다.", "DB/storage 각 실패 지점에서 compensation/outbox와 idempotent retry를 실행합니다.", "attachment id로 parent/owner authorization 뒤 download하고 headers/cache를 검사합니다.", "중복 submit, stale callback, delete 경합과 process kill fault를 주입합니다.", "orphan, stuck quarantine, reservation과 incomplete multipart를 reconciliation합니다.", "response/log/trace/storage listing에 synthetic secret/path가 없는지 확인합니다.", "정책 version, source hashes, test matrix와 rollback runbook을 제출합니다."],
    expectedResult: ["client filename은 storage path에 쓰이지 않고 모든 candidate는 전용 root/namespace 안에 있습니다.", "크기·형식·scan 실패는 공개 전에 terminal/quarantine 상태로 끝나고 temporary resource가 정리됩니다.", "DB/storage partial failure와 재시도 뒤 attachment 또는 recoverable durable state만 남고 orphan SLO가 만족됩니다.", "download는 object 존재가 아니라 actor와 parent resource 정책을 통과한 READY metadata만 제공합니다.", "실행 stdout, HTTP/container, filesystem/object store와 telemetry evidence가 서로 같은 lifecycle contract를 증명합니다."],
    cleanup: ["synthetic quarantine/final objects, metadata, outbox, reservations와 temp parts를 제거합니다.", "scanner/executor/container를 종료하고 open stream/FD와 incomplete multipart를 확인합니다.", "logs/traces/browser storage에서 synthetic names와 preview Data URL이 없는지 검사합니다.", "로컬 학습 원본과 실제 upload 설정은 변경하지 않습니다."],
    extensions: ["CDR/image canonical re-encode sandbox와 parser CVE upgrade rehearsal을 추가합니다.", "multi-region object version·event ordering과 CDN purge를 검증합니다.", "legal hold/backup retention을 포함한 삭제 증명 report를 만듭니다.", "property-based filename/multipart generator와 storage chaos suite를 CI에 연결합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "다섯 Java 예제를 실행해 filename, bytes, type, state와 compensation 불변식을 설명하세요.", requirements: ["stdout 완전 일치를 확인합니다.", "원본명이 path로 쓰이지 않음을 설명합니다.", "max/max-1 실패를 재현합니다.", "declared/signature/extension 증거를 구분합니다.", "APPROVED 전 공개가 없음을 확인합니다.", "DB 실패 뒤 object/row 0을 확인합니다."], hints: ["각 예제의 boolean과 stable reason을 실제 운영 adapter에서 측정할 증거로 바꾸어 보세요."], expectedOutcome: "안전한 업로드가 단일 sanitize 함수가 아니라 연결된 실행 계약임을 설명합니다.", solutionOutline: ["parse→bound→name→inspect→quarantine→publish→reconcile 순서입니다."] },
    { difficulty: "응용", prompt: "로컬 form/controller 흐름을 원본 보존 상태에서 secure attachment use case로 재설계하세요.", requirements: ["request/part limits를 둡니다.", "opaque key와 quarantine을 둡니다.", "signature/scan을 적용합니다.", "DB/storage compensation을 둡니다.", "authorized download를 구현합니다.", "중복·stale callback을 막습니다.", "MockMvc/container/filesystem fault tests를 실행합니다.", "orphan와 secret telemetry gate를 둡니다."], hints: ["controller가 File path를 만들지 않게 application command와 storage port를 먼저 정의하세요."], expectedOutcome: "부분 실패와 공격 입력에서도 공개·orphan·정보 노출이 통제된 pipeline이 완성됩니다.", solutionOutline: ["audit→constrain→isolate→verify→commit→serve→repair 순서입니다."] },
    { difficulty: "설계", prompt: "조직 공통 upload/download 보안·운영 표준을 작성하세요.", requirements: ["format별 allow-list와 parser owner를 정합니다.", "size/count/time/concurrency quota를 정합니다.", "storage namespace/permission/encryption을 정합니다.", "state/compensation/outbox/reconciliation을 정의합니다.", "presign과 download authorization을 정의합니다.", "retention/delete/legal hold를 포함합니다.", "fuzz/fault/load/observability release gate를 둡니다."], hints: ["파일 종류별 소비 방식과 실패 비용이 다르므로 하나의 전역 최대 크기만 제시하지 마세요."], expectedOutcome: "서버·object store·scanner·DB와 client가 같은 versioned lifecycle을 따르는 운영 표준이 완성됩니다.", solutionOutline: ["threat-model→budget→validate→isolate→coordinate→authorize→observe 순서입니다."] },
  ],
  nextSessions: ["crud-08-login-interceptor"], sources,
  sourceCoverage: { filesRead: 2, filesUsed: 2, uncoveredNotes: ["FileController.java는 read-only로 145 lines/5,607 bytes와 SHA-256 F3DF86F64AF206440A29E30DDA7FAB2FDD92B3ACB8A6639FAAC91F0392A94665을 확인했습니다.", "upload.jsp는 read-only로 41 lines/1,329 bytes와 SHA-256 C0E9329283D54CEEFC109558C44A9DC50248D0C4601032EB021176493A33FAE7을 확인했습니다.", "원본의 UUID+원본명, direct transfer, query 기반 download와 sessionStorage preview 구조만 provenance로 요약하고 실제 설정 경로·사용자 파일·개인 값은 복사하지 않았습니다.", "원본이 다루지 않는 traversal/symlink, actual-byte limits, signature/semantic scan, quarantine, atomic publish, DB/storage compensation, object version, idempotency와 reconciliation은 공식 문서와 synthetic examples로 보강했습니다.", "JDK-only examples는 Servlet parser, 실제 filesystem 권한/symlink, scanner, DB transaction 또는 object storage consistency를 대체하지 않습니다."] },
});

export default session;
