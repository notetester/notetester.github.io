import type {
  Comparison,
  DetailedCodeExample,
  DetailedSession,
  DiagnosticCase,
  SessionConcept,
  SessionExercise,
  SessionLab,
  SessionPrerequisite,
  SessionSource,
} from "../types";

export type ExpertTopic = {
  id: string;
  title: string;
  lead: string;
  explanations: string[];
  concepts: SessionConcept[];
  codeExamples?: DetailedCodeExample[];
  diagnostics: DiagnosticCase[];
  comparisons?: Comparison[];
  expertNotes: string[];
};

export type ExpertSessionProfile = {
  inventoryId: string;
  slug: string;
  courseId: string;
  moduleId: string;
  order: number;
  title: string;
  subtitle: string;
  level: DetailedSession["level"];
  estimatedMinutes: number;
  coreQuestion: string;
  summary: string;
  objectives: string[];
  prerequisites: SessionPrerequisite[];
  keywords: string[];
  topics: ExpertTopic[];
  lab: SessionLab;
  exercises: SessionExercise[];
  nextSessions: string[];
  sources: SessionSource[];
  sourceCoverage: DetailedSession["sourceCoverage"];
};

function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function buildReviews(topics: ExpertTopic[]) {
  return topics.flatMap((topic) => {
    const firstConcept = topic.concepts[0];
    const firstDiagnostic = topic.diagnostics[0];
    ensure(firstConcept, `${topic.id}: at least one concept is required`);
    ensure(firstDiagnostic, `${topic.id}: at least one diagnostic is required`);
    ensure(topic.explanations[0] && topic.explanations[1], `${topic.id}: two explanations are required`);

    return [
      {
        question: `${topic.title}에서 ${firstConcept.term}을(를) 한 문장 정의가 아니라 실행 불변식으로 설명하면 어떻게 되나요?`,
        answer: `${firstConcept.definition} ${firstConcept.detail.join(" ")} ${topic.explanations[0]}`,
      },
      {
        question: `${topic.title} 실습에서 “${firstDiagnostic.symptom}” 증상이 보이면 무엇을 어떤 순서로 확인해야 하나요?`,
        answer: `${firstDiagnostic.likelyCause} 먼저 ${firstDiagnostic.checks.join(" → ")} 순서로 증거를 확인하고, ${firstDiagnostic.fix} 재발 방지는 ${firstDiagnostic.prevention}`,
      },
      {
        question: `${topic.title}을(를) 운영 환경에 적용할 때 초급 예제에서 추가해야 할 검증 근거는 무엇인가요?`,
        answer: `${topic.explanations[1]} 특히 ${topic.expertNotes.join(" ")}를 설계·테스트·관측 증거로 남겨야 합니다.`,
      },
      {
        question: `${topic.title}에서 코드가 실행됐다는 사실과 설계가 올바르다는 사실을 어떻게 구분하나요?`,
        answer: `실행 성공은 한 입력의 관찰 결과일 뿐입니다. 정상·경계·실패 입력, 불변식, 동시성 또는 복구 조건을 따로 검증하고 ${firstDiagnostic.prevention}까지 자동화해야 설계 근거가 됩니다.`,
      },
    ];
  });
}

function buildChecklist(topics: ExpertTopic[]) {
  return topics.flatMap((topic) => {
    const concept = topic.concepts[0];
    const diagnostic = topic.diagnostics[0];
    ensure(concept, `${topic.id}: checklist concept is required`);
    ensure(diagnostic, `${topic.id}: checklist diagnostic is required`);
    const example = topic.codeExamples?.[0];

    return [
      `${topic.title}: ${concept.term}의 정의와 적용 범위를 자신의 말로 설명했다.`,
      `${topic.title}: 정상 입력뿐 아니라 경계값·빈 값·중복·실패 입력의 예상 결과를 먼저 적었다.`,
      `${topic.title}: ${diagnostic.symptom} 증상을 재현하고 원인과 수정 근거를 분리했다.`,
      `${topic.title}: ${diagnostic.prevention} 항목을 자동 테스트나 리뷰 규칙으로 옮겼다.`,
      example
        ? `${topic.title}: ${example.filename ?? example.id}을(를) 직접 실행하고 문서의 stdout과 한 글자씩 대조했다.`
        : `${topic.title}: 실행 예제가 없는 설계 절도 앞선 예제를 변형해 반례를 만들고 결과를 기록했다.`,
      `${topic.title}: ${topic.expertNotes[0] ?? "운영 경계"}를 배포 전 증거 목록에 반영했다.`,
    ];
  });
}

export function createExpertSession(profile: ExpertSessionProfile): DetailedSession {
  ensure(profile.topics.length >= 10, `${profile.slug}: topics must be at least 10`);
  ensure(profile.objectives.length >= 5, `${profile.slug}: objectives must be at least 5`);
  ensure(profile.exercises.length >= 3, `${profile.slug}: exercises must be at least 3`);
  ensure(profile.sources.length >= 10, `${profile.slug}: sources must be at least 10`);

  const examples = profile.topics.flatMap((topic) => topic.codeExamples ?? []);
  const diagnostics = profile.topics.flatMap((topic) => topic.diagnostics);
  ensure(examples.length >= 5, `${profile.slug}: examples must be at least 5`);
  ensure(diagnostics.length >= 10, `${profile.slug}: diagnostics must be at least 10`);
  ensure(new Set(profile.topics.map((topic) => topic.id)).size === profile.topics.length, `${profile.slug}: duplicate topic id`);
  ensure(new Set(examples.map((example) => example.id)).size === examples.length, `${profile.slug}: duplicate example id`);
  ensure(new Set(profile.sources.map((source) => source.id)).size === profile.sources.length, `${profile.slug}: duplicate source id`);

  return {
    schemaVersion: 2,
    inventoryIds: [profile.inventoryId],
    slug: profile.slug,
    courseId: profile.courseId,
    moduleId: profile.moduleId,
    order: profile.order,
    title: profile.title,
    subtitle: profile.subtitle,
    level: profile.level,
    estimatedMinutes: profile.estimatedMinutes,
    coreQuestion: profile.coreQuestion,
    summary: profile.summary,
    objectives: profile.objectives,
    prerequisites: profile.prerequisites,
    keywords: profile.keywords,
    chapters: profile.topics.map((topic) => ({
      id: topic.id,
      title: topic.title,
      lead: topic.lead,
      explanations: topic.explanations,
      concepts: topic.concepts,
      codeExamples: topic.codeExamples ?? [],
      diagnostics: topic.diagnostics,
      comparisons: topic.comparisons,
      expertNotes: topic.expertNotes,
    })),
    lab: profile.lab,
    exercises: profile.exercises,
    reviewQuestions: buildReviews(profile.topics),
    completionChecklist: buildChecklist(profile.topics),
    nextSessions: profile.nextSessions,
    sources: profile.sources,
    sourceCoverage: profile.sourceCoverage,
  };
}
