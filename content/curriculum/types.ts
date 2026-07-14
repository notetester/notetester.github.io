export type CurriculumLevel = "입문" | "기초" | "중급" | "고급" | "전문가";

export type CurriculumCourse = {
  id: string;
  order: number;
  title: string;
  shortTitle: string;
  description: string;
  audience: string;
  outcomes: string[];
  capstones: string[];
  modules: CurriculumModule[];
};

export type CurriculumModule = {
  id: string;
  order: number;
  title: string;
  description: string;
  level: CurriculumLevel;
  outcomes: string[];
  sessionSlugs: string[];
  checkpointProject?: string;
};

export type SessionPrerequisite = {
  title: string;
  reason: string;
  sessionSlug?: string;
};

export type SessionConcept = {
  term: string;
  definition: string;
  detail: string[];
  analogy?: string;
  caveat?: string;
};

export type CodeWalkthrough = {
  lines: string;
  explanation: string;
};

export type DetailedCodeExample = {
  id: string;
  title: string;
  language: string;
  filename?: string;
  purpose: string;
  code: string;
  walkthrough: CodeWalkthrough[];
  run: {
    environment: string[];
    command: string;
    input?: string;
  };
  output: {
    value: string;
    explanation: string[];
  };
  downloads?: Array<{
    label: string;
    filename: string;
    href: string;
    description: string;
    checks: string[];
  }>;
  experiments: Array<{
    change: string;
    prediction: string;
    result: string;
  }>;
  sourceRefs: string[];
};

export type DiagnosticCase = {
  symptom: string;
  likelyCause: string;
  checks: string[];
  fix: string;
  prevention: string;
};

export type Comparison = {
  title: string;
  options: Array<{
    name: string;
    chooseWhen: string;
    avoidWhen: string;
    tradeoffs: string[];
  }>;
};

export type DetailedChapter = {
  id: string;
  title: string;
  lead: string;
  explanations: string[];
  concepts: SessionConcept[];
  codeExamples: DetailedCodeExample[];
  diagnostics: DiagnosticCase[];
  comparisons?: Comparison[];
  expertNotes?: string[];
};

export type SessionExercise = {
  difficulty: "따라하기" | "응용" | "설계";
  prompt: string;
  requirements: string[];
  hints: string[];
  expectedOutcome: string;
  solutionOutline?: string[];
};

export type SessionLab = {
  title: string;
  scenario: string;
  setup: string[];
  steps: string[];
  expectedResult: string[];
  cleanup?: string[];
  extensions: string[];
};

export type SessionSource = {
  id: string;
  repository: string;
  path: string;
  publicUrl?: string;
  usedFor: string[];
  evidence: string;
};

export type DetailedSession = {
  schemaVersion: 2;
  inventoryIds: string[];
  slug: string;
  courseId: string;
  moduleId: string;
  order: number;
  title: string;
  subtitle: string;
  level: CurriculumLevel;
  estimatedMinutes: number;
  coreQuestion: string;
  summary: string;
  objectives: string[];
  prerequisites: SessionPrerequisite[];
  keywords: string[];
  chapters: DetailedChapter[];
  lab: SessionLab;
  exercises: SessionExercise[];
  reviewQuestions: Array<{
    question: string;
    answer: string;
  }>;
  completionChecklist: string[];
  relatedGlossary?: string[];
  nextSessions: string[];
  sources: SessionSource[];
  sourceCoverage: {
    filesRead: number;
    filesUsed: number;
    uncoveredFiles?: string[];
    uncoveredNotes: string[];
  };
};
