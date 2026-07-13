import type { DetailedCodeExample, DiagnosticCase, SessionConcept } from "../types";
import type { ExpertTopic } from "./create-expert-session.ts";

export type AppliedTopicInput = {
  id: string;
  title: string;
  lead: string;
  mechanism: string;
  workflow: string;
  invariants: string;
  edgeCases: string;
  failureModes: string;
  verification: string;
  operations: string;
  concepts: SessionConcept[];
  codeExamples?: DetailedCodeExample[];
  comparisons?: ExpertTopic["comparisons"];
  expertNotes?: string[];
};

function diagnostic(
  symptom: string,
  likelyCause: string,
  checks: string[],
  fix: string,
  prevention: string,
): DiagnosticCase {
  return { symptom, likelyCause, checks, fix, prevention };
}

export function appliedTopic(input: AppliedTopicInput): ExpertTopic {
  const first = input.concepts[0];
  const second = input.concepts[1] ?? first;
  if (!first || !second) throw new Error(input.id + ": at least two concepts are required");

  return {
    id: input.id,
    title: input.title,
    lead: input.lead,
    explanations: [
      input.mechanism + " 이 메커니즘을 API 이름 암기로 끝내지 않고 입력, 내부 상태 또는 tree, 계산 단계, 관찰 가능한 결과와 부작용의 순서로 추적합니다. 어느 단계가 language·library·browser·network·server 중 누구의 보장인지 표시해야 다른 실행 환경에서도 같은 판단을 다시 할 수 있습니다.",
      input.workflow + " 구현 순서는 가장 작은 정상 사례를 먼저 고정하고, 경계값과 실패를 추가한 뒤 실제 통합 환경에서 관찰하는 방식으로 진행합니다. 코드 한 줄이 실행됐다는 사실과 user-visible contract, 데이터 무결성, 접근성, 보안과 복구 가능성이 맞다는 사실을 서로 다른 검증 항목으로 둡니다.",
      input.invariants + " 불변식은 예제 설명에만 두지 않고 type 또는 schema, runtime guard, automated test, telemetry와 release gate 중 적절한 enforcement layer에 중복 방어합니다. 같은 사실을 여러 state에 복제해 동기화하기보다 authoritative owner와 파생 계산을 명시합니다.",
      input.edgeCases + " 정상 입력 하나 뒤에는 missing, empty, null, wrong type, duplicate, reordering, slow response, cancellation, retry, concurrent update와 stale version을 질문합니다. 모든 항목이 적용되지 않으면 이유를 적고, 적용되는 항목은 expected result와 cleanup까지 독립 fixture로 만듭니다.",
      input.failureModes + " 보이는 증상만 임시로 숨기지 않고 source input에서 final output까지 evidence chain을 모읍니다. console message, component tree 또는 network 한 화면에 의존하지 않고 source snapshot, runtime versions, raw protocol, state transition, logs와 user outcome을 시간·correlation 기준으로 연결합니다.",
      input.verification + " 검증은 pure model이나 unit test, component integration, 실제 browser·server contract, production-like artifact와 canary readback의 층으로 나눕니다. test double이 증명하지 못하는 parser, scheduler, DOM, browser policy, database 또는 provider behavior는 실제 compatible fixture에서 다시 실행합니다.",
      input.operations + " 운영에서는 latency·error·resource·cardinality budget, low-cardinality reason code, privacy-safe telemetry, owner와 runbook을 둡니다. 변경에는 compatibility window, feature flag 또는 canary, immutable artifact, rollback trigger와 reconciliation 절차를 포함해 성공 경로만큼 실패 후 복구도 반복 연습합니다.",
      "이 절은 앞선 내용을 읽지 않고 바로 열어도 이해할 수 있도록 " + first.term + "과 " + second.term + "의 역할을 다시 정의하고, 선행 개념이 필요하면 prerequisite session으로 이동할 수 있게 합니다. 반대로 다음 절에서는 여기서 만든 불변식과 검증 evidence를 입력으로 사용하므로 이름이 비슷한 API가 아니라 명시한 contract를 연결 고리로 삼습니다.",
    ],
    concepts: input.concepts,
    codeExamples: input.codeExamples ?? [],
    diagnostics: [
      diagnostic(
        input.title + "에서 정상 demo는 되지만 경계 입력이나 두 번째 실행부터 결과가 달라집니다.",
        "핵심 mechanism과 state owner는 구현했지만 " + input.edgeCases + " 조건을 contract와 test에 포함하지 않았습니다.",
        ["입력의 runtime type·identity·version을 기록합니다.", "authoritative state와 파생 state의 변경 순서를 봅니다.", "첫 실행과 재실행의 side effect·cleanup 차이를 비교합니다.", "실제 runtime/browser/network 결과와 pure model 결과를 분리합니다."],
        input.invariants + " 조건을 executable guard와 positive/negative test로 옮기고 failure를 안정된 code와 복구 action으로 반환합니다.",
        input.verification + " 검증을 CI와 production-like canary에서 반복하고 regression budget을 유지합니다.",
      ),
      diagnostic(
        input.title + " 변경 후 특정 환경·사용자·배포에서만 느려지거나 조용히 잘못된 결과가 남습니다.",
        "개발의 작은 fixture와 happy path만 보았고 " + input.failureModes + " 위험을 telemetry, compatibility와 rollback gate에 연결하지 않았습니다.",
        ["source·lockfile·runtime·configuration snapshot을 대조합니다.", "request 또는 user action의 end-to-end correlation을 추적합니다.", "cardinality·latency·memory·network·render counts를 baseline과 비교합니다.", "old/new artifact와 cache/state compatibility를 검사합니다."],
        input.workflow + " 순서로 최소 재현을 만들고 root cause가 확인된 한 경계만 수정한 뒤 old/new behavior parity를 검증합니다.",
        input.operations + " 항목을 dashboard, alert, owner, canary와 rollback rehearsal로 자동화합니다.",
      ),
    ],
    comparisons: input.comparisons,
    expertNotes: [
      ...(input.expertNotes ?? []),
      "교육용 model의 deterministic output을 실제 library/runtime guarantee로 과장하지 않고 적용 범위를 example output 바로 아래에 기록합니다.",
      "실제 credential·개인정보·private endpoint와 원본 domain values를 공개 fixture에 복사하지 않고 synthetic data와 structural provenance만 사용합니다.",
    ],
  };
}

export function concept(term: string, definition: string, detail: string[], caveat?: string): SessionConcept {
  return { term, definition, detail, caveat };
}

export function nodeExample(
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
    language: "node",
    filename,
    purpose,
    code,
    walkthrough: [
      { lines: "1-8", explanation: "synthetic input과 검증할 state·tree·protocol 불변식을 선언합니다." },
      { lines: "9-끝에서 3줄 전", explanation: "외부 dependency 없이 핵심 변환 또는 transition을 결정적으로 실행하고 실패를 stable result로 분류합니다." },
      { lines: "마지막 3줄", explanation: "핵심 결과를 stdout으로 출력해 문서의 예상 결과와 완전히 같은지 확인합니다." },
    ],
    run: { environment: ["Node.js 20 이상", "ES module eval", "browser·network·credential 불필요"], command: "node " + filename },
    output: {
      value: output,
      explanation: [
        "stdout은 예상 결과와 완전히 같아야 합니다.",
        "Node model은 실제 React scheduler·DOM·browser policy·network·server integration을 대체하지 않으므로 session lab의 compatible fixture를 별도로 실행합니다.",
      ],
    },
    experiments: [
      { change: "정상 input 하나를 empty, duplicate, stale, reordered 또는 cancelled case로 바꿉니다.", prediction: "명시한 invariant에 따라 결과 또는 stable failure code가 달라집니다.", result: "stdout과 실제 component/browser integration 결과를 나란히 기록합니다." },
      { change: "같은 action을 두 번 또는 다른 순서로 실행합니다.", prediction: "idempotent operation은 같은 final state를 만들고 identity-sensitive operation은 의도한 차이를 보입니다.", result: "state transition, side-effect count와 cleanup evidence를 비교합니다." },
    ],
    sourceRefs,
  };
}
