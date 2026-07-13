import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sessionsRoot = path.join(projectRoot, "content", "curriculum", "sessions");

async function collect(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(target));
    else if (entry.isFile() && entry.name.endsWith(".ts")) files.push(target);
  }
  return files.sort((left, right) => left.localeCompare(right, "en"));
}

function normalize(value) {
  return value.replaceAll("\r\n", "\n");
}

function outputMatches(actual, documented) {
  const expected = normalize(documented);
  return actual === expected || actual === `${expected}\n`;
}

function runProcess(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    timeout: 120_000,
    windowsHide: true,
    ...options,
  });
  return {
    status: result.status,
    signal: result.signal,
    error: result.error?.message,
    stdout: normalize(result.stdout ?? ""),
    stderr: normalize(result.stderr ?? ""),
  };
}

async function runJava(example) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "learning-archive-java-"));
  try {
    const filename = path.basename(example.filename ?? `${example.id}.java`);
    const target = path.join(directory, filename);
    await writeFile(target, example.code, "utf8");
    return runProcess("java", [filename], { cwd: directory });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function runExample(example) {
  const language = example.language.toLowerCase();
  if (language === "python") return runProcess("python", ["-I", "-X", "utf8", "-c", example.code]);
  if (language === "java") return runJava(example);
  if (language === "node") return runProcess(process.execPath, ["--input-type=module", "--eval", example.code]);
  return null;
}

const requested = process.argv.slice(2);
const files = requested.length
  ? requested.map((file) => path.resolve(projectRoot, file))
  : await collect(sessionsRoot);

const rows = [];
let skipped = 0;
for (const file of files) {
  const imported = await import(`${pathToFileURL(file).href}?examples=${Date.now()}`);
  const session = imported.default ?? imported.session;
  const examples = session.chapters.flatMap((chapter) => chapter.codeExamples ?? []);
  for (const example of examples) {
    const result = await runExample(example);
    if (!result) {
      skipped += 1;
      continue;
    }
    const exact = result.status === 0
      && result.signal === null
      && !result.error
      && result.stderr === ""
      && outputMatches(result.stdout, example.output.value);
    rows.push({
      session: session.slug,
      example: example.id,
      language: example.language,
      exact,
      ...result,
      expected: example.output.value,
    });
  }
}

const failures = rows.filter((row) => !row.exact);
console.log(JSON.stringify({
  files: files.length,
  executed: rows.length,
  passed: rows.length - failures.length,
  failed: failures.length,
  skipped,
}));
for (const failure of failures) console.log(JSON.stringify(failure));
if (failures.length) process.exitCode = 1;
