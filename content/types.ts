export type TrackId =
  | "web"
  | "java"
  | "backend"
  | "frontend-devops"
  | "ai"
  | "projects";

export type LessonLevel = "입문" | "기초" | "중급" | "실전";

export type CodeExample = {
  language: string;
  label: string;
  code: string;
  explanation?: string[];
};

export type ExecutionResult = {
  label: string;
  output: string;
  explanation?: string;
};

export type LessonSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  code?: CodeExample;
  result?: ExecutionResult;
  tip?: string;
};

export type SourceReference = {
  label: string;
  repository: string;
  path?: string;
  note?: string;
};

export type Lesson = {
  slug: string;
  track: TrackId;
  order: number;
  title: string;
  eyebrow: string;
  summary: string;
  level: LessonLevel;
  duration: string;
  why: string;
  prerequisites: string[];
  keywords: string[];
  sections: LessonSection[];
  checkpoints: string[];
  related: string[];
  sources: SourceReference[];
};

export type Track = {
  id: TrackId;
  order: number;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  icon: string;
};
