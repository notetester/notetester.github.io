import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sessionsRoot = path.join(projectRoot, "content", "curriculum", "sessions");
const finalMode = process.argv.includes("--final");

async function collect(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(target));
    else if (entry.isFile() && entry.name.endsWith(".ts")) files.push(target);
  }
  return files.sort();
}

const files = await collect(sessionsRoot);
if (!files.length) {
  console.error("No detailed session files found.");
  process.exit(1);
}

const sessions = [];
const failures = [];
for (const file of files) {
  const imported = await import(`${pathToFileURL(file).href}?validation=${Date.now()}`);
  const session = imported.default ?? imported.session;
  if (!session) {
    failures.push(`${path.relative(projectRoot, file)}: no default export or named session export`);
    continue;
  }
  sessions.push({ file, session });
}

const knownSlugs = new Set(sessions.map(({ session }) => session.slug));
if (knownSlugs.size !== sessions.length) failures.push("Duplicate detailed session slug detected.");
const allInventoryIds = sessions.flatMap(({ session }) => session.inventoryIds ?? []);
if (new Set(allInventoryIds).size !== allInventoryIds.length) failures.push("Duplicate inventoryIds detected across detailed sessions.");

function textLength(value) {
  if (typeof value === "string") return value.length;
  if (Array.isArray(value)) return value.reduce((sum, item) => sum + textLength(item), 0);
  if (!value || typeof value !== "object") return 0;
  return Object.entries(value).reduce(
    (sum, [key, item]) => sum + (key === "code" ? 0 : textLength(item)),
    0,
  );
}

for (const { file, session } of sessions) {
  const label = `${path.relative(projectRoot, file)} (${session.slug ?? "missing slug"})`;
  const chapters = session.chapters ?? [];
  const examples = chapters.flatMap((chapter) => chapter.codeExamples ?? []);
  const diagnostics = chapters.flatMap((chapter) => chapter.diagnostics ?? []);
  const proseCharacters = textLength(session);
  const difficulties = new Set((session.exercises ?? []).map((exercise) => exercise.difficulty));
  const chapterIds = chapters.map((chapter) => chapter.id);
  const exampleIds = examples.map((example) => example.id);
  const sourceIds = (session.sources ?? []).map((source) => source.id);
  const referencedSourceIds = new Set(examples.flatMap((example) => example.sourceRefs ?? []));

  if (session.schemaVersion !== 2) failures.push(`${label}: schemaVersion must be 2`);
  if (!(session.inventoryIds ?? []).length) failures.push(`${label}: inventoryIds required`);
  if ((session.inventoryIds ?? []).length !== 1) failures.push(`${label}: exactly one atomic inventory id required`);
  if (!session.courseId || !session.moduleId) failures.push(`${label}: courseId/moduleId required`);
  if (chapters.length < 7) failures.push(`${label}: chapters ${chapters.length} < 7`);
  if (new Set(chapterIds).size !== chapterIds.length) failures.push(`${label}: duplicate chapter id`);
  if (proseCharacters < 3500) failures.push(`${label}: prose characters ${proseCharacters} < 3500`);
  if (examples.length < 2) failures.push(`${label}: code examples ${examples.length} < 2`);
  if (new Set(exampleIds).size !== exampleIds.length) failures.push(`${label}: duplicate code example id`);
  if (diagnostics.length < 2) failures.push(`${label}: diagnostics ${diagnostics.length} < 2`);
  if ((session.objectives ?? []).length < 3) failures.push(`${label}: objectives < 3`);
  if ((session.reviewQuestions ?? []).length < 5) failures.push(`${label}: review questions < 5`);
  if ((session.completionChecklist ?? []).length < 5) failures.push(`${label}: completion checklist < 5`);
  if ((session.exercises ?? []).length < 3) failures.push(`${label}: exercises < 3`);
  for (const required of ["따라하기", "응용", "설계"]) {
    if (!difficulties.has(required)) failures.push(`${label}: missing ${required} exercise`);
  }
  if (!session.lab?.steps?.length || !session.lab?.expectedResult?.length) failures.push(`${label}: incomplete lab`);
  if (!(session.sources ?? []).length) failures.push(`${label}: no source evidence`);
  if (new Set(sourceIds).size !== sourceIds.length) failures.push(`${label}: duplicate source id`);
  for (const sourceId of sourceIds) {
    if (!referencedSourceIds.has(sourceId)) failures.push(`${label}: source ${sourceId} is never referenced by an example`);
  }
  if ((session.sourceCoverage?.filesUsed ?? 0) > (session.sourceCoverage?.filesRead ?? 0)) {
    failures.push(`${label}: filesUsed exceeds filesRead`);
  }
  for (const source of session.sources ?? []) {
    if (/BACKUP_|github\.com\/notetester\/(CareerTuner|TripTogether)(?:\/|$)/i.test(source.publicUrl ?? "")) {
      failures.push(`${label}: private or backup source URL`);
    }
    if (source.publicUrl && !/^https:\/\//.test(source.publicUrl)) failures.push(`${label}: source publicUrl must be https`);
    if (/^[A-Za-z]:\\/.test(source.path ?? "")) failures.push(`${label}: source path exposes an absolute local path`);
  }
  for (const example of examples) {
    if (!example.code || !example.run?.command || !example.output?.value || !(example.walkthrough ?? []).length) {
      failures.push(`${label}: incomplete code example ${example.id ?? "missing id"}`);
    }
    for (const sourceRef of example.sourceRefs ?? []) {
      if (!sourceIds.includes(sourceRef)) failures.push(`${label}: code example ${example.id} references unknown source ${sourceRef}`);
    }
  }
  if (finalMode) {
    for (const prerequisite of session.prerequisites ?? []) {
      if (prerequisite.sessionSlug && !knownSlugs.has(prerequisite.sessionSlug)) {
        failures.push(`${label}: missing prerequisite ${prerequisite.sessionSlug}`);
      }
    }
    for (const next of session.nextSessions ?? []) {
      if (!knownSlugs.has(next)) failures.push(`${label}: missing next session ${next}`);
    }
  }
}

const totals = {
  sessions: sessions.length,
  proseCharacters: sessions.reduce((sum, item) => sum + textLength(item.session), 0),
  estimatedMinutes: sessions.reduce((sum, item) => sum + item.session.estimatedMinutes, 0),
  chapters: sessions.reduce((sum, item) => sum + item.session.chapters.length, 0),
  codeExamples: sessions.reduce(
    (sum, item) => sum + item.session.chapters.reduce((count, chapter) => count + chapter.codeExamples.length, 0),
    0,
  ),
  diagnostics: sessions.reduce(
    (sum, item) => sum + item.session.chapters.reduce((count, chapter) => count + chapter.diagnostics.length, 0),
    0,
  ),
  exercises: sessions.reduce((sum, item) => sum + item.session.exercises.length, 0),
};

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(JSON.stringify(totals));
