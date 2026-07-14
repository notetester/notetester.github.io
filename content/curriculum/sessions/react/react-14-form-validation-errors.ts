import type { SessionSource } from "../../types";
import { appliedTopic, concept as c, nodeExample as node } from "../../session-builders/create-applied-topic.ts";
import { createExpertSession } from "../../session-builders/create-expert-session.ts";

const topics = [
  appliedTopic({
    id: "source-validation-audit", title: "원본 등록·로그인 flow를 field·form·network·security 오류 경계로 감사합니다",
    lead: "required attribute와 한 줄 error state를 출발점으로 삼되 실제 source의 error 미표시, generic catch, label association, password type, response logging과 token storage를 숨기지 않습니다.",
    mechanism: "RegisterPage는 controlled six-field state, required, async register와 success redirect를 사용하지만 error state를 화면에 render하지 않고 response를 console에 남깁니다. LoginPage는 form error를 표시하지만 credential field type과 error classification, accessible association가 충분하지 않으며 Auth adapter는 authentication concerns를 함께 갖습니다.",
    workflow: "field definitions, native constraints, client schema, server error shape, network/auth failures, UI placement/focus/announcement와 sensitive data flow를 source-to-sink table로 만듭니다.",
    invariants: "원본은 read-only이고 실제 routes/field values/tokens는 공개 example에 복사하지 않으며 credential·PII·full response를 console, analytics, URL이나 public DOM에 남기지 않습니다.",
    edgeCases: "all empty, one invalid, multiple errors, server duplicate, 400/401/409/422/429/5xx, offline/timeout/abort, double submit, stale response와 redirect failure를 다룹니다.",
    failureModes: "state에 error를 set해도 render/association가 없으면 user는 실패 이유를 모르고 generic catch가 validation과 outage를 같게 처리하며 full response log가 secrets/PII를 노출할 수 있습니다.",
    verification: "source hash, DOM role/name/description, status/problem mapping, abort/race, forbidden logs/storage와 server negative tests를 실행합니다.",
    operations: "raw inputs 없이 field/code/stage/version별 error rate와 recovery를 관찰하고 credential incident, provider outage와 rollback runbook을 둡니다.",
    concepts: [
      c("error boundary map", "field validation, cross-field, form business, transport, authentication와 unexpected UI failure를 owner·display·recovery로 연결한 표입니다.", ["한 error string보다 넓습니다.", "layer별 정책을 둡니다."]),
      c("sensitive sink", "credential·token·PII가 저장·전송·표시·logging될 수 있어 명시적 금지/보호가 필요한 위치입니다.", ["console/DOM/storage도 포함합니다.", "negative scan을 둡니다."]),
      c("action provenance", "어떤 form version, endpoint contract, request identity와 response evidence가 UI result를 만들었는지 추적하는 정보입니다.", ["raw payload는 제외합니다.", "race diagnosis에 사용합니다."]),
    ],
    codeExamples: [node("react14-audit", "등록·로그인 오류 contract gap inventory", "React14Audit.mjs", "관찰된 behavior와 missing UI/security qualifications을 stable audit codes로 요약합니다.", String.raw`const checks = [
  ["controlled-fields", true],
  ["submit-pending", true],
  ["register-error-visible", false],
  ["label-associated", false],
  ["credential-type", false],
  ["response-redaction", false],
];
console.log("present=" + checks.filter((x) => x[1]).map((x) => x[0]).join(","));
console.log("gaps=" + checks.filter((x) => !x[1]).map((x) => x[0]).join(","));
console.log("qualified=" + checks.every((x) => x[1]));`, "present=controlled-fields,submit-pending\ngaps=register-error-visible,label-associated,credential-type,response-redaction\nqualified=false", ["local-register", "local-login", "local-auth-api", "local-auth-store"])],
  }),
  appliedTopic({
    id: "validation-layering", title: "native constraint·client schema·server validation·domain authorization을 층별로 설계합니다",
    lead: "client required 한 줄을 전체 validation으로 오해하지 않고 빠른 UX, runtime type safety, authoritative business rules와 authorization의 서로 다른 책임을 중복 방어합니다.",
    mechanism: "HTML constraints는 browser-level required/type/min/max/pattern feedback을 제공하고 client schema는 cross-platform structured errors를 만들며 server는 tampered requests를 포함해 schema, business invariant와 authorization을 최종 판정합니다.",
    workflow: "field contract에서 syntax/shape, normalization, business uniqueness, authorization와 external verification을 분류하고 각 layer의 stable code와 user message를 매핑합니다.",
    invariants: "client success가 server acceptance를 보장하지 않고 server는 deny-by-default authorization과 canonical normalization을 수행하며 client는 server errors를 무시하지 않습니다.",
    edgeCases: "browser validation disabled, direct API call, unknown fields, Unicode normalization, duplicate race, stale entity version, role/tenant mismatch와 rate limit을 다룹니다.",
    failureModes: "client-only validation은 우회되고 duplicated client/server regex가 drift하며 server first-error string만 반환하면 fields와 recovery를 안정적으로 연결하기 어렵습니다.",
    verification: "native invalid, schema corpus, direct tampered API, concurrent duplicate, authorization negative, client/server contract and version compatibility tests를 실행합니다.",
    operations: "validation code distribution과 schema version drift를 관찰하고 rule rollout은 backward-compatible window, reconciliation와 rollback을 둡니다.",
    concepts: [
      c("constraint validation", "HTML controls의 required/type/pattern/range 등 browser validity model입니다.", ["UX layer입니다.", "server validation을 대체하지 않습니다."]),
      c("schema validation", "runtime request/data의 fields, types, ranges와 allowed values를 structured result로 검사하는 과정입니다.", ["client/server에서 사용할 수 있습니다.", "business rule과 구분합니다."]),
      c("authoritative validation", "tampered client를 전제로 server가 persistence/mutation 직전에 수행하는 최종 schema·business·authorization 판정입니다.", ["client 결과를 신뢰하지 않습니다.", "transaction과 연결합니다."]),
    ],
    codeExamples: [node("react14-layered-validator", "field schema와 business 결과를 stable codes로 누적", "React14Validator.mjs", "synthetic account input을 allowlist하고 field별 codes를 deterministic하게 정렬합니다.", String.raw`function validate(input, existing = new Set()) {
  const errors = [];
  if (typeof input.handle !== "string" || input.handle.trim().length < 3) errors.push(["handle", "too-short"]);
  if (typeof input.contact !== "string" || !input.contact.includes("@")) errors.push(["contact", "invalid"]);
  if (typeof input.secret !== "string" || input.secret.length < 12) errors.push(["secret", "too-short"]);
  if (existing.has(input.handle?.trim())) errors.push(["handle", "duplicate"]);
  return errors.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
}
console.log(JSON.stringify(validate({ handle: "ab", contact: "bad", secret: "short" })));
console.log(JSON.stringify(validate({ handle: "taken", contact: "a@example.test", secret: "long-enough-1" }, new Set(["taken"]))));`, "[[\"contact\",\"invalid\"],[\"handle\",\"too-short\"],[\"secret\",\"too-short\"]]\n[[\"handle\",\"duplicate\"]]", ["html-constraints", "mdn-constraint-validation", "owasp-input-validation", "react-input"])],
  }),
  appliedTopic({
    id: "field-error-state", title: "field value·touched·dirty·error를 분리하고 validation timing을 제어합니다",
    lead: "typing 첫 글자부터 모든 error를 붉게 보여 주거나 하나의 global string만 두지 않고 field meta와 submit attempts를 user intent에 맞게 관리합니다.",
    mechanism: "value는 draft, touched는 focus/blur interaction, dirty는 baseline difference, error는 current validation result이고 submitted는 form attempt를 나타냅니다. 표시 여부는 error 존재와 touched/submitted policy를 조합합니다.",
    workflow: "cheap syntax는 change/blur, expensive/cross-field는 blur/submit 또는 debounce로 실행하고 first submit 이후 수정된 field만 즉시 재검증하는 정책을 문서화합니다.",
    invariants: "error state를 value에서 파생 가능하면 중복 저장하지 않고 message visibility와 actual validity를 구분하며 corrections가 error를 즉시/예측 가능하게 해제합니다.",
    edgeCases: "focus without change, autofill, paste, programmatic reset, server field error 뒤 edit, dynamic field removal와 localization message change를 다룹니다.",
    failureModes: "global error 하나는 어느 field가 문제인지 잃고 stale stored errors는 수정 후에도 남으며 aggressive change validation은 IME와 screen reader announcements를 방해합니다.",
    verification: "pristine/touched/dirty/submitted matrix, fix/clear, reset, autofill/IME, dynamic fields와 role/description DOM tests를 실행합니다.",
    operations: "field error exposure와 correction success를 code only로 관찰하고 raw values나 message text를 high-cardinality metric으로 쓰지 않습니다.",
    concepts: [
      c("touched", "field가 focus/blur 등 user interaction을 거쳤는지 나타내는 meta state입니다.", ["dirty와 다릅니다.", "message timing에 사용합니다."]),
      c("dirty", "current normalized value가 baseline과 의미적으로 다른지 나타내는 상태입니다.", ["touched와 독립입니다.", "navigation/reset에 사용합니다."]),
      c("validation timing", "change, blur, submit, async response 중 언제 어떤 rule을 실행·표시할지 정한 정책입니다.", ["cost와 UX를 고려합니다.", "rule별로 다를 수 있습니다."]),
    ],
    codeExamples: [node("react14-field-meta", "touched·dirty·submitted error 표시 정책", "React14FieldMeta.mjs", "같은 validation error가 interaction meta에 따라 언제 보이는지 pure function으로 계산합니다.", String.raw`function visible(field, submitted) {
  return Boolean(field.error && (field.touched || submitted));
}
const cases = [
  { touched: false, dirty: false, error: "required" },
  { touched: true, dirty: false, error: "required" },
  { touched: true, dirty: true, error: null },
];
for (const field of cases) {
  console.log("normal=" + visible(field, false) + ",submitted=" + visible(field, true));
}`, "normal=false,submitted=true\nnormal=true,submitted=true\nnormal=false,submitted=false", ["react-state-structure", "wcag-error-identification", "wcag-labels-instructions"])],
  }),
  appliedTopic({
    id: "cross-field-form-rules", title: "cross-field·conditional·collection validation을 form-level invariants로 표현합니다",
    lead: "확인 값, 날짜 범위, 조건부 주소와 최소 한 개 선택처럼 한 field만으로 결정할 수 없는 규칙을 ad-hoc Effect가 아니라 pure form validator와 explicit dependencies로 만듭니다.",
    mechanism: "form-level validator는 canonical snapshot 전체를 받고 field/global errors를 반환합니다. 조건부 field는 활성 조건, requiredness, submitted projection와 reset/retention policy를 함께 가집니다.",
    workflow: "rule id, input dependencies, output field/global paths, normalization, severity와 submit blocking 여부를 metadata로 정의하고 dependency changes 때 affected rules만 재평가합니다.",
    invariants: "UI에서 숨긴 field 값이 무심코 submit되지 않고 paired/range invariants는 같은 snapshot에서 평가되며 server가 동일 business rule을 authoritative하게 확인합니다.",
    edgeCases: "both empty, one empty, start=end, timezone/date-only, conditional field hide/show, list duplicates, minimum/maximum selection와 dynamic schema를 다룹니다.",
    failureModes: "confirm field가 source secret을 state/log에 복제하고 hidden stale value가 submit되며 separate Effects가 서로 다른 snapshots에서 errors를 만들 수 있습니다.",
    verification: "decision tables, pairwise/property tests, hide/show/reset, submitted projection, server parity와 concurrent change snapshots를 실행합니다.",
    operations: "rule version과 failure code를 form schema에 묶고 rule rollout, stored drafts, old clients와 rollback compatibility를 운영합니다.",
    concepts: [
      c("cross-field invariant", "둘 이상의 canonical fields 관계가 만족해야 하는 form/domain 조건입니다.", ["한 snapshot에서 평가합니다.", "server에서도 확인합니다."]),
      c("conditional field", "다른 field/state 조건에 따라 활성·required·visible·submitted 여부가 달라지는 field입니다.", ["stale value policy가 필요합니다.", "접근성 순서를 고려합니다."]),
      c("global error", "특정 한 field보다 form transaction 전체에 연결되는 validation/business failure입니다.", ["field errors와 함께 반환할 수 있습니다.", "summary에 표시합니다."]),
    ],
    codeExamples: [node("react14-cross-field", "조건부 contact와 기간 invariant", "React14CrossField.mjs", "form snapshot에서 field/global errors를 함께 만들고 stable order로 출력합니다.", String.raw`function validate(form) {
  const errors = [];
  if (form.notify && !form.contact) errors.push(["contact", "required-when-notify"]);
  if (form.start && form.end && form.start > form.end) errors.push(["end", "before-start"]);
  if (!form.terms) errors.push(["form", "terms-required"]);
  return errors;
}
console.log(JSON.stringify(validate({ notify: true, contact: "", start: 5, end: 3, terms: false })));
console.log(JSON.stringify(validate({ notify: false, contact: "", start: 3, end: 5, terms: true })));`, "[[\"contact\",\"required-when-notify\"],[\"end\",\"before-start\"],[\"form\",\"terms-required\"]]\n[]", ["react-state-structure", "owasp-input-validation", "html-constraints"])],
  }),
  appliedTopic({
    id: "async-validation-race", title: "async validation의 debounce·abort·sequence와 server race를 통제합니다",
    lead: "사용 가능 여부 같은 확인 결과가 typing 순서와 다르게 도착할 수 있으므로 latest-request ownership, cancellation와 최종 submit 재검증을 명시합니다.",
    mechanism: "client는 normalized candidate별 request를 debounce할 수 있고 AbortController 또는 monotonically increasing sequence로 stale response commit을 막습니다. availability check와 실제 create transaction 사이에는 race가 남습니다.",
    workflow: "cheap local schema 통과 후 debounce를 시작하고 previous request를 abort하며 response가 current value/sequence와 일치할 때만 field status를 갱신합니다.",
    invariants: "pending 결과를 valid로 취급하지 않고 stale/aborted response가 current error를 덮지 않으며 uniqueness는 final server transaction/constraint가 판정합니다.",
    edgeCases: "fast typing, backspace to cached value, identical request dedup, timeout/offline, 429, component unmount, submit while pending와 concurrent registration을 다룹니다.",
    failureModes: "slow old available response가 fast new unavailable response 뒤 도착해 green UI를 만들고 pre-check success를 uniqueness guarantee로 믿으면 race duplicate가 발생합니다.",
    verification: "out-of-order deferred promises, abort, cache TTL, offline/timeout/rate limit, unmount cleanup, submit pending and concurrent server constraint tests를 실행합니다.",
    operations: "validation request rate, abort/stale/latency/result codes와 server conflict를 관찰하고 circuit/fallback, quota와 rollback을 둡니다.",
    concepts: [
      c("debounce", "입력 변화가 일정 시간 멈춘 뒤 마지막 작업만 시작해 request 빈도를 줄이는 scheduling 방식입니다.", ["latency tradeoff가 있습니다.", "correctness를 보장하지 않습니다."]),
      c("stale response", "현재 field value/version보다 이전 request의 늦게 도착한 결과입니다.", ["commit하지 않습니다.", "sequence/candidate로 식별합니다."]),
      c("TOCTOU", "검사 시점과 사용/commit 시점 사이 상태가 바뀌어 pre-check 결과가 더 이상 유효하지 않은 race입니다.", ["server constraint가 필요합니다.", "client check는 UX입니다."]),
    ],
    codeExamples: [node("react14-latest-wins", "async validation sequence의 stale response 거부", "React14Latest.mjs", "request sequence 1과 2가 역순 도착해도 current sequence만 commit합니다.", String.raw`let current = 0;
let state = { candidate: "", result: "idle" };
function start(candidate) {
  current += 1;
  state = { candidate, result: "pending" };
  return { candidate, sequence: current };
}
function finish(request, result) {
  if (request.sequence !== current || request.candidate !== state.candidate) return "stale";
  state = { candidate: request.candidate, result };
  return "committed";
}
const first = start("alpha");
const second = start("beta");
console.log("second=" + finish(second, "unavailable"));
console.log("first=" + finish(first, "available"));
console.log(JSON.stringify(state));`, "second=committed\nfirst=stale\n{\"candidate\":\"beta\",\"result\":\"unavailable\"}", ["mdn-abort-controller", "react-effect-fetching", "owasp-input-validation"])],
  }),
  appliedTopic({
    id: "server-problem-mapping", title: "HTTP status·Problem Details·field codes를 typed UI error로 매핑합니다",
    lead: "success boolean과 message 문자열만 destructure하지 않고 transport status, content type, stable problem type/code, field errors, correlation과 retryability를 보존합니다.",
    mechanism: "HTTP client adapter는 network/timeout/abort와 valid HTTP response를 구분하고 application/problem+json 같은 structured response를 parse해 field, form, auth, rate-limit와 unexpected categories로 분류합니다.",
    workflow: "status/media/schema를 검증하고 known problem type/code를 exhaustive mapper로 UI model에 변환하며 unknown response는 generic safe message와 correlation id만 사용합니다.",
    invariants: "server message/HTML을 그대로 dangerous render하지 않고 401 credential error는 enumeration-safe하게 표시하며 429 Retry-After와 409/422 field/business recovery를 구분합니다.",
    edgeCases: "empty/non-JSON response, proxy HTML, unknown problem version, duplicate field paths, nested/list paths, 401 vs 403, 409 version/duplicate, 5xx and offline을 다룹니다.",
    failureModes: "모든 catch를 server connection failure로 바꾸면 validation/security/outage가 왜곡되고 200 success=false는 intermediaries/metrics/retry semantics를 약화시킵니다.",
    verification: "status/media/problem corpus, unknown/malformed body, field path mapping, enumeration/redaction, retry-after와 correlation tests를 실행합니다.",
    operations: "problem type/status/version/retry outcome을 관찰하고 raw detail/stack/PII를 제외하며 unknown type alert와 backward-compatible mapper rollout을 둡니다.",
    concepts: [
      c("Problem Details", "HTTP API 오류의 type, title, status, detail, instance와 extensions를 구조화하는 표준 형식입니다.", ["field extension은 contract를 정의합니다.", "raw exception을 노출하지 않습니다."]),
      c("error taxonomy", "field, business, auth, rate-limit, transient, offline, aborted와 unexpected를 stable categories로 분류한 체계입니다.", ["UI/retry/telemetry가 달라집니다.", "message text와 분리합니다."]),
      c("retryability", "같은 또는 수정된 request를 언제 다시 시도하면 성공 가능성이 있는지 나타내는 policy입니다.", ["idempotency와 연결합니다.", "모든 5xx를 무한 retry하지 않습니다."]),
    ],
    codeExamples: [node("react14-problem-map", "HTTP problem을 field/form/retry UI model로 변환", "React14Problems.mjs", "known validation, conflict, rate limit와 unknown server failure를 stable categories로 매핑합니다.", String.raw`function map(status, problem = {}) {
  if (status === 422) return { kind: "validation", fields: problem.fields || {} };
  if (status === 409) return { kind: "conflict", retry: false };
  if (status === 429) return { kind: "rate-limit", retry: true };
  if (status >= 500) return { kind: "server", retry: true };
  return { kind: "unexpected", retry: false };
}
console.log(JSON.stringify(map(422, { fields: { contact: "invalid" } })));
console.log(JSON.stringify(map(409)));
console.log(JSON.stringify(map(429)));
console.log(JSON.stringify(map(503)));`, "{\"kind\":\"validation\",\"fields\":{\"contact\":\"invalid\"}}\n{\"kind\":\"conflict\",\"retry\":false}\n{\"kind\":\"rate-limit\",\"retry\":true}\n{\"kind\":\"server\",\"retry\":true}", ["rfc9457", "rfc9110", "spring-problem-detail", "local-register", "local-login"])],
  }),
  appliedTopic({
    id: "accessible-error-focus", title: "label·description·summary·focus와 live announcement로 errors를 복구 가능하게 만듭니다",
    lead: "붉은 paragraph 한 줄에 그치지 않고 어떤 field가 왜 잘못됐으며 어디로 이동해 어떻게 고칠지 keyboard와 assistive technology가 이해하도록 연결합니다.",
    mechanism: "field error element의 id를 aria-describedby/errormessage와 연결하고 aria-invalid를 current validity에 맞추며 submit failure에서는 summary 또는 first invalid field로 predictable focus를 이동합니다.",
    workflow: "visible label/instructions를 먼저 두고 inline error, form summary links, server/global status와 pending/success announcement의 role/live politeness를 중복 announcement 없이 설계합니다.",
    invariants: "color·asterisk·placeholder만으로 required/error를 표현하지 않고 focus를 user typing 중 빼앗지 않으며 error message는 구체적 correction suggestion을 제공합니다.",
    edgeCases: "multiple errors, dynamic field removal, repeated submit, async field result, modal/route transition, screen reader virtual cursor, localization와 mobile zoom을 다룹니다.",
    failureModes: "error state가 render돼도 field와 programmatically 연결되지 않으면 screen reader context가 없고 every keystroke assertive live message는 사용을 방해합니다.",
    verification: "role/name/description queries, keyboard submit/focus order, screen reader spot checks, zoom/contrast, multiple errors/fix/re-submit와 no-duplicate announcement를 test합니다.",
    operations: "automated accessibility scan과 manual browser/AT matrix, error correction completion과 regressions를 운영하고 exceptions에 owner/expiry를 둡니다.",
    concepts: [
      c("error summary", "submit 실패 시 form-level heading/list로 errors와 해당 fields 이동 links를 제공하는 구조입니다.", ["inline errors를 보완합니다.", "focus policy가 필요합니다."]),
      c("aria-invalid", "control current value가 invalid임을 accessibility API에 알리는 state입니다.", ["message 연결과 함께 씁니다.", "validity와 동기화합니다."]),
      c("live region", "동적으로 바뀐 status/error text를 assistive technology에 announcement하는 영역입니다.", ["politeness를 선택합니다.", "과도한 반복을 피합니다."]),
    ],
    codeExamples: [node("react14-focus-order", "field error document order와 focus target 결정", "React14Focus.mjs", "schema order에 따라 first invalid field와 summary links를 안정적으로 계산합니다.", String.raw`const order = ["handle", "contact", "secret"];
function summary(errors) {
  const fields = order.filter((name) => errors[name]);
  return { focus: fields[0] || null, links: fields.map((name) => "#" + name) };
}
console.log(JSON.stringify(summary({ contact: "invalid", secret: "too-short" })));
console.log(JSON.stringify(summary({})));`, "{\"focus\":\"contact\",\"links\":[\"#contact\",\"#secret\"]}\n{\"focus\":null,\"links\":[]}", ["wcag-error-identification", "wcag-error-suggestion", "wcag-focus-order", "local-register"])],
  }),
  appliedTopic({
    id: "security-enumeration-redaction", title: "credential·PII·enumeration·rate limit과 error redaction을 validation UX에 통합합니다",
    lead: "친절한 오류가 account existence, password policy internals, tokens나 server stack을 공격자에게 알려 주지 않도록 threat model과 legitimate recovery를 균형 있게 설계합니다.",
    mechanism: "public authentication/recovery endpoints는 존재 여부를 과도하게 구분하지 않는 messages/timing을 사용하고 registration duplicate 같은 product policy는 abuse/rate-limit/privacy와 함께 결정합니다.",
    workflow: "field sensitivity, attackers, enumeration channels, logs/storage/analytics sinks와 support recovery를 threat model하고 client는 stable public codes만 표시합니다.",
    invariants: "password/token은 console, error object serialization, URL, analytics와 persisted form에 남기지 않고 server stack/query/internal field names를 public detail로 노출하지 않습니다.",
    edgeCases: "timing/size difference, localization strings, 429 behavior, account locked/disabled, social login, support trace, browser extension/localStorage compromise와 shared device를 다룹니다.",
    failureModes: "response console logging과 localStorage token은 XSS/extension에 민감하며 login not-found vs wrong-password detail은 account enumeration을 돕습니다.",
    verification: "secret canary scan, public message/timing/size differential, logs/storage/DOM/network captures, rate-limit, authorization와 incident logout/revocation tests를 실행합니다.",
    operations: "security events는 account identifier를 protected pseudonymous form으로 다루고 retention/access/audit, alert thresholds와 credential/token rotation runbook을 운영합니다.",
    concepts: [
      c("enumeration", "응답 내용, status, timing 또는 size 차이로 account/resource 존재 여부를 추론하는 공격입니다.", ["public endpoints를 검토합니다.", "rate limit만으로 끝나지 않습니다."]),
      c("redaction", "진단에 불필요하거나 민감한 fields를 logs/errors/telemetry에서 제거·대체하는 처리입니다.", ["allowlist를 선호합니다.", "구조적 scan을 둡니다."]),
      c("secret canary", "노출되면 안 되는 synthetic marker를 넣어 DOM/log/storage/report로 새는지 자동 검사하는 값입니다.", ["실제 secret을 쓰지 않습니다.", "end-to-end scan에 사용합니다."]),
    ],
  }),
  appliedTopic({
    id: "message-localization-recovery", title: "stable error code를 locale message·parameter·recovery action으로 안전하게 변환합니다",
    lead: "server가 보낸 임의 문장이나 번역 key를 그대로 화면에 출력하지 않고 stable code와 allowlisted parameters를 client message catalog, accessible instruction와 user action으로 매핑합니다.",
    mechanism: "validation result는 stable code, field/path와 typed parameters를 운반하고 client catalog가 current locale의 short message, detailed instruction와 recovery action을 선택합니다. unknown code는 safe generic fallback과 correlation을 사용합니다.",
    workflow: "code별 owner, parameter schema, severity, field/global placement, translation key와 allowed actions를 registry로 정의하고 locale fallback, plural/number/date formatting과 right-to-left layout을 test합니다.",
    invariants: "localized wording을 machine branch나 analytics key로 사용하지 않고 untrusted parameter를 HTML로 삽입하지 않으며 error text만으로 field identity와 required action을 잃지 않습니다.",
    edgeCases: "missing translation, unknown code/version, plural zero/one/many, long text, right-to-left, parameter type mismatch, screen reader pronunciation와 locale switch 중 current errors를 다룹니다.",
    failureModes: "server detail 문장을 그대로 render하면 XSS·정보 노출과 inconsistent wording이 생기고 번역 누락이 blank error를 만들며 exact message snapshot은 copy change마다 깨집니다.",
    verification: "all codes×supported locales completeness, unknown/fallback, parameter schema, escaping, long/RTL visual, accessible name/description와 action tests를 실행합니다.",
    operations: "unknown code와 missing translation을 version/locale로 관찰하고 message catalog release를 application compatibility와 canary하며 emergency fallback/rollback을 둡니다.",
    concepts: [
      c("stable error code", "번역 문구와 독립적으로 validation/business failure category를 식별하는 versioned machine value입니다.", ["branch와 telemetry에 사용합니다.", "raw exception name을 피합니다."]),
      c("message catalog", "error code와 locale을 user-visible message, instruction와 recovery action으로 매핑하는 versioned resource입니다.", ["parameter schema를 둡니다.", "fallback locale가 필요합니다."]),
      c("safe interpolation", "allowlisted typed parameters를 text context에 escaping해 localized template에 삽입하는 처리입니다.", ["HTML injection을 허용하지 않습니다.", "formatters를 사용합니다."]),
    ],
  }),
  appliedTopic({
    id: "validation-tests-operations", title: "validation decision tables·property tests·observability와 rule rollout을 운영합니다",
    lead: "몇 개 example snapshot에 의존하지 않고 boundary corpus, cross-field combinations, async race, browser accessibility와 server parity를 repeatable release evidence로 만듭니다.",
    mechanism: "rule마다 equivalence partitions/boundaries와 expected code/path를 table로 만들고 pure validator unit, component user flow, API contract, malicious request와 production-like browser tests로 층을 나눕니다.",
    workflow: "source/schema version을 fixture에 고정하고 deterministic data/clock/network를 사용하며 new rule은 observe-only 또는 advisory→enforce 단계로 rollout하고 old clients를 측정합니다.",
    invariants: "tests가 exact localized message wording만 고정하지 않고 stable code/path/recovery와 accessible DOM outcome을 assert하며 production telemetry에는 raw inputs가 없습니다.",
    edgeCases: "Unicode/fuzz, maximum size, simultaneous async, stale error, retries, browser autofill/IME, localization, old drafts/clients와 rule rollback을 다룹니다.",
    failureModes: "happy path tests는 bypass/race를 놓치고 strict new server rule을 즉시 enforce하면 old client submissions가 대량 실패하며 message snapshot은 번역 변경에 취약합니다.",
    verification: "decision/property/fuzz, user-event/a11y, contract/malicious, load/rate, compatibility matrix, canary and rollback rehearsal를 실행합니다.",
    operations: "field/rule/version별 failure/correction/latency, unknown problem types와 support volume을 privacy-safe하게 관찰하고 owner/expiry/runbook을 둡니다.",
    concepts: [
      c("decision table", "input conditions 조합과 expected validation code/path/blocking 결과를 표로 정리한 test oracle입니다.", ["cross-field에 유용합니다.", "불가능 조합을 표시합니다."]),
      c("property test", "다양한 generated inputs에서 invariant가 항상 유지되는지 검증하는 test 방식입니다.", ["example tests를 보완합니다.", "shrinking/repro seed를 둡니다."]),
      c("observe-only rule", "failure를 기록하지만 아직 submission을 막지 않아 impact와 client compatibility를 측정하는 rollout 단계입니다.", ["민감값은 기록하지 않습니다.", "enforcement 기준을 둡니다."]),
    ],
  }),
];

const sources: SessionSource[] = [
  { id: "local-register", repository: "D:/dev/my-app03", path: "src/pages/RegisterPage.jsx", usedFor: ["multi-field registration", "required/native validation", "error not rendered", "response logging"], evidence: "2026-07-14 read-only audit: 96 lines, 4,659 bytes, SHA-256 97E846CDDF471EA415ACB659E344B63889B2364D1A256876816F08B8891D71C4. 실제 field values/routes는 복사하지 않았습니다." },
  { id: "local-login", repository: "D:/dev/my-app03", path: "src/pages/LoginPage.jsx", usedFor: ["credential form", "global error/pending", "generic catch"], evidence: "2026-07-14 read-only audit: 97 lines, 4,359 bytes, SHA-256 9F2817A1D28183C3967F9B21273D93397D8231B5D2EB5D62C952B4DBDEEA09A8. 실제 credentials/tokens는 사용하지 않았습니다." },
  { id: "local-auth-api", repository: "D:/dev/my-app03", path: "src/api/Auth.jsx", usedFor: ["HTTP adapter/error context", "response interceptor", "sensitive storage/logging audit"], evidence: "2026-07-14 read-only audit: 156 lines, 5,591 bytes, SHA-256 6722BE000C762CE3ABE30E6BD54C358D48BB9173AA5A7B158519ED6F44866F64. endpoint/token values는 공개 examples에 복사하지 않았습니다." },
  { id: "local-auth-store", repository: "D:/dev/my-app03", path: "src/store/useAuthStore.jsx", usedFor: ["auth UI owner", "logout cleanup context"], evidence: "2026-07-14 read-only audit: 23 lines, 908 bytes, SHA-256 A63D98044B54E43F4DCA3B27157F97E6E138639763BB2B496AF55CBC690B0EAA." },
  { id: "react-input", repository: "React DOM official API", path: "reference/react-dom/components/input", publicUrl: "https://react.dev/reference/react-dom/components/input", usedFor: ["controlled validation props", "input caveats"], evidence: "current React input API를 확인했습니다." },
  { id: "react-state-structure", repository: "React official documentation", path: "learn/choosing-the-state-structure", publicUrl: "https://react.dev/learn/choosing-the-state-structure", usedFor: ["avoid duplicated errors", "state normalization"], evidence: "React state structure principles를 확인했습니다." },
  { id: "react-effect-fetching", repository: "React official documentation", path: "learn/you-might-not-need-an-effect#fetching-data", publicUrl: "https://react.dev/learn/you-might-not-need-an-effect#fetching-data", usedFor: ["async race/cleanup context"], evidence: "data fetching race and framework alternatives guidance를 확인했습니다." },
  { id: "html-constraints", repository: "WHATWG HTML Living Standard", path: "form-control-infrastructure.html#constraints", publicUrl: "https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constraints", usedFor: ["constraint validation model"], evidence: "HTML constraint validation algorithm과 validity를 확인했습니다." },
  { id: "mdn-constraint-validation", repository: "MDN Web Docs", path: "Web/HTML/Guides/Constraint_validation", publicUrl: "https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Constraint_validation", usedFor: ["native validation APIs", "client/server caveat"], evidence: "constraint validation guide와 server-side requirement를 확인했습니다." },
  { id: "mdn-abort-controller", repository: "MDN Web Docs", path: "Web/API/AbortController", publicUrl: "https://developer.mozilla.org/en-US/docs/Web/API/AbortController", usedFor: ["async validation cancellation"], evidence: "AbortController request cancellation contract를 확인했습니다." },
  { id: "owasp-input-validation", repository: "OWASP Cheat Sheet Series", path: "Input_Validation_Cheat_Sheet.html", publicUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html", usedFor: ["allowlist/server validation", "normalization"], evidence: "input validation allowlist and server enforcement guidance를 확인했습니다." },
  { id: "rfc9457", repository: "IETF RFC 9457", path: "rfc9457.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9457.html", usedFor: ["Problem Details fields", "extension contract"], evidence: "HTTP Problem Details standard를 확인했습니다." },
  { id: "rfc9110", repository: "IETF RFC 9110", path: "rfc9110.html", publicUrl: "https://www.rfc-editor.org/rfc/rfc9110.html", usedFor: ["HTTP status/retry semantics"], evidence: "HTTP semantics and status meanings를 확인했습니다." },
  { id: "spring-problem-detail", repository: "Spring Framework official API", path: "javadoc-api/org/springframework/http/ProblemDetail.html", publicUrl: "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/ProblemDetail.html", usedFor: ["Spring problem mapping", "properties extension"], evidence: "Spring ProblemDetail current API를 확인했습니다." },
  { id: "wcag-error-identification", repository: "W3C WCAG 2.2", path: "understanding/error-identification.html", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html", usedFor: ["field error identification"], evidence: "WCAG error identification guidance를 확인했습니다." },
  { id: "wcag-labels-instructions", repository: "W3C WCAG 2.2", path: "understanding/labels-or-instructions.html", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html", usedFor: ["labels/instructions"], evidence: "WCAG labels/instructions guidance를 확인했습니다." },
  { id: "wcag-error-suggestion", repository: "W3C WCAG 2.2", path: "understanding/error-suggestion.html", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html", usedFor: ["correction suggestions"], evidence: "WCAG error suggestion guidance를 확인했습니다." },
  { id: "wcag-focus-order", repository: "W3C WCAG 2.2", path: "understanding/focus-order.html", publicUrl: "https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html", usedFor: ["focus movement/order"], evidence: "WCAG focus order guidance를 확인했습니다." },
];

const session = createExpertSession({
    inventoryId: "react-14-form-validation-submit", slug: "react-14-form-validation-errors",
  courseId: "react", moduleId: "react-events-forms-hooks", order: 4,
  title: "form validation과 오류 UX", subtitle: "field meta·cross-field·async race·Problem Details·접근성·보안을 하나의 복구 가능한 validation contract로 묶습니다.",
  level: "중급", estimatedMinutes: 125,
  coreQuestion: "사용자 입력 오류, server business failure와 network/security 문제를 정확히 분류하고 누구나 고칠 수 있는 accessible UI로 어떻게 연결할까요?",
  summary: "my-app03의 RegisterPage, LoginPage, Auth adapter와 auth store를 read-only로 감사해 required fields, async submit, pending/error state와 redirect 흐름을 출발점으로 사용합니다. 원본의 registration error 미표시, generic catch, label association, credential input, response logging과 sensitive storage risks를 숨기지 않고 native/client/server validation layering, field meta/timing, cross-field rules, async latest-wins, RFC 9457 mapping, accessible error focus, enumeration/redaction와 rule rollout까지 current official sources와 일곱 Node examples로 확장합니다. 실제 routes, user data, credentials와 tokens는 공개 examples에 사용하지 않습니다.",
  objectives: ["원본 validation/error/security source-to-sink gaps를 감사한다.", "native·client schema·server business/authorization validation을 구분한다.", "touched/dirty/submitted와 message timing을 설계한다.", "cross-field/conditional rules를 pure snapshot에서 평가한다.", "async validation race를 abort/sequence로 통제한다.", "HTTP status와 Problem Details를 typed UI errors로 매핑한다.", "field/summary/focus/live error UX를 접근 가능하게 만든다.", "enumeration, redaction와 secret sinks를 방어한다.", "decision/property/contract/browser tests와 observe-to-enforce rollout을 운영한다."],
  prerequisites: [{ title: "controlled form과 입력 상태 모델", reason: "raw draft, canonical state, submit과 server validation boundary를 알아야 validation 결과의 owner와 display timing을 정확히 설계할 수 있습니다.", sessionSlug: "react-13-controlled-form" }],
  keywords: ["validation", "constraint validation", "touched", "dirty", "cross-field", "async validation", "AbortController", "Problem Details", "field errors", "focus", "enumeration", "redaction"],
  topics,
  lab: {
    title: "등록·로그인 form을 typed Problem Details와 accessible error flow로 qualification하기",
    scenario: "원본은 변경하지 않고 synthetic fields, delayed/out-of-order responses와 disposable server fixture로 field부터 security incident까지 검증합니다.",
    setup: ["Node 20 이상", "React/browser user-event fixture", "disposable HTTP server with RFC 9457 responses", "fake timers/deferred requests", "screen reader/keyboard test environment", "원본 4 files read-only", "synthetic non-sensitive accounts"],
    steps: ["원본 4 files hash와 field/form/network/auth/security error map을 작성합니다.", "native constraints와 client/server schema/business/authorization responsibilities를 정의합니다.", "field value/touched/dirty/submitted와 message visibility state machine을 구현합니다.", "cross-field/conditional decision tables와 property corpus를 실행합니다.", "async availability를 debounce/abort/sequence하고 out-of-order responses를 fault-test합니다.", "400/401/403/409/422/429/5xx/offline/abort/malformed problem을 typed UI로 매핑합니다.", "inline errors, summary, focus, aria-invalid/describedby와 live status를 user-flow test합니다.", "credential/PII/token canaries로 console/DOM/storage/network/report leak를 scan합니다.", "concurrent duplicate/rate-limit/enumeration and server authorization negative tests를 실행합니다.", "observe-only new rule→canary enforce→rollback과 telemetry/readback을 rehearsal합니다."],
    expectedResult: ["field/global/transport/auth errors가 stable typed categories와 recovery를 가집니다.", "stale async response와 duplicate submit이 current UI/server truth를 덮지 않습니다.", "keyboard와 assistive technology users가 errors를 찾고 수정할 수 있습니다.", "credential/token/PII와 account existence가 logs/DOM/storage/messages로 불필요하게 노출되지 않습니다.", "old/new form/schema versions와 rule rollback이 작동합니다."],
    cleanup: ["temporary server, builds, browser storage, test accounts와 deferred requests를 제거합니다.", "secret canaries와 captured network/log artifacts를 폐기합니다.", "fake timers, verbose diagnostics와 observe-only flags를 원복합니다.", "원본 4 files hash/status unchanged를 확인합니다."],
    extensions: ["shared client/server schema code generation과 drift checks를 추가합니다.", "password manager/WebAuthn flows의 validation UX를 비교합니다.", "property-based Unicode/contact/date generators를 도입합니다.", "real user error recovery와 accessibility conformance dashboard를 privacy-safe하게 구축합니다."],
  },
  exercises: [
    { difficulty: "따라하기", prompt: "일곱 Node examples를 실행하고 등록 form의 각 오류 layer와 연결하세요.", requirements: ["stdout 완전 일치", "source gaps", "layered field codes", "meta visibility", "cross-field", "latest-wins", "Problem mapping", "focus order", "model/integration 구분"], hints: ["generic catch message를 모든 오류의 root cause라고 쓰지 마세요."], expectedOutcome: "입력부터 server/problem/accessibility까지 오류 evidence chain을 설명합니다.", solutionOutline: ["audit→validate/meta→cross/async→map→focus/security 순서입니다."] },
    { difficulty: "응용", prompt: "원본 RegisterPage 오류 flow를 production-safe하게 재설계하세요.", requirements: ["field schema/codes", "server authoritative rules", "structured problems", "async race", "field+summary focus", "enumeration/redaction", "secret canary", "compatibility/canary rollback"], hints: ["error state를 set하는 것만으로 사용자에게 보이는 것은 아닙니다."], expectedOutcome: "고칠 수 있고 공격자에게 과도한 정보를 주지 않는 form이 완성됩니다.", solutionOutline: ["threat/error map→state/model→HTTP adapter→accessible DOM→tests/ops 순서입니다."] },
    { difficulty: "설계", prompt: "조직의 form validation/error governance를 작성하세요.", requirements: ["layer responsibilities", "field/cross/async rules", "Problem taxonomy", "a11y focus/live", "security/privacy", "test corpus", "schema compatibility", "observe/enforce/rollback runbook"], hints: ["localized message 모음이 아니라 stable codes와 lifecycle을 정의하세요."], expectedOutcome: "rule 작성부터 운영·폐기까지 감사 가능한 validation 표준이 완성됩니다.", solutionOutline: ["classify→code→validate→map→announce→protect→qualify→operate 순서입니다."] },
  ],
  nextSessions: ["react-15-effect-synchronization"], sources,
  sourceCoverage: { filesRead: 4, filesUsed: 4, uncoveredNotes: ["실제 routes, field values, credentials, tokens와 response bodies는 공개 examples에 복사하지 않고 structural findings와 synthetic codes만 사용했습니다.", "원본의 auth token storage/interceptor 전체 교정은 DevOps token-client-integration과 React network/auth 후속 세션에서 별도 threat model로 심화합니다.", "Node examples는 actual browser constraint validation/IME/focus/accessibility, network cancellation와 server transaction/authorization을 대체하지 않으므로 lab integration이 필요합니다.", "Effect와 async cleanup의 일반 원리는 React15~16에서 별도 심화합니다."] },
});

export default session;
