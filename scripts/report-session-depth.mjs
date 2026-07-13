import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sessionsRoot = path.join(projectRoot, "content", "curriculum", "sessions");
const strict = process.argv.includes("--strict");
const list = strict || process.argv.includes("--list");

const thresholds = {
  chapters: 10,
  examples: 5,
  diagnostics: 10,
  reviews: 15,
  checklist: 15,
  sources: 10,
  proseCharacters: 15_000,
};

async function collect(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(target));
    else if (entry.isFile() && entry.name.endsWith(".ts")) files.push(target);
  }
  return files.sort((left, right) => left.localeCompare(right, "en"));
}

function textLength(value) {
  if (typeof value === "string") return value.length;
  if (Array.isArray(value)) return value.reduce((sum, item) => sum + textLength(item), 0);
  if (!value || typeof value !== "object") return 0;
  return Object.entries(value).reduce(
    (sum, [key, item]) => sum + (key === "code" ? 0 : textLength(item)),
    0,
  );
}

const rows = [];
for (const file of await collect(sessionsRoot)) {
  const imported = await import(`${pathToFileURL(file).href}?depth=${Date.now()}`);
  const session = imported.default ?? imported.session;
  const examples = session.chapters.flatMap((chapter) => chapter.codeExamples ?? []);
  const diagnostics = session.chapters.flatMap((chapter) => chapter.diagnostics ?? []);
  const metrics = {
    chapters: session.chapters.length,
    examples: examples.length,
    diagnostics: diagnostics.length,
    reviews: session.reviewQuestions.length,
    checklist: session.completionChecklist.length,
    sources: session.sources.length,
    proseCharacters: textLength(session),
  };
  const missing = Object.entries(thresholds)
    .filter(([key, minimum]) => metrics[key] < minimum)
    .map(([key]) => key);
  rows.push({ slug: session.slug, courseId: session.courseId, metrics, missing });
}

const gaps = rows.filter((row) => row.missing.length);
const byCourse = Object.fromEntries(
  [...new Set(rows.map((row) => row.courseId))]
    .sort((left, right) => left.localeCompare(right, "en"))
    .map((courseId) => [courseId, {
      sessions: rows.filter((row) => row.courseId === courseId).length,
      gaps: gaps.filter((row) => row.courseId === courseId).length,
    }]),
);

console.log(JSON.stringify({
  sessions: rows.length,
  passing: rows.length - gaps.length,
  gaps: gaps.length,
  thresholds,
  byCourse,
}));

if (list) {
  for (const gap of gaps) {
    console.log(`${gap.slug}: ${gap.missing.map((key) => `${key}=${gap.metrics[key]}/${thresholds[key]}`).join(", ")}`);
  }
}

if (strict && gaps.length) process.exitCode = 1;
