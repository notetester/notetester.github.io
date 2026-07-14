import { readdir } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sessionsRoot = path.join(projectRoot, "content", "curriculum", "sessions");
const verifier = path.join(projectRoot, "scripts", "verify-executable-examples.mjs");

async function collect(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(target));
    else if (entry.isFile() && entry.name.endsWith(".ts")) files.push(target);
  }
  return files.sort((left, right) => left.localeCompare(right, "en"));
}

function runShard(files, shardIndex) {
  return new Promise((resolve) => {
    const relativeFiles = files.map((file) => path.relative(projectRoot, file));
    const child = spawn(process.execPath, ["--experimental-strip-types", verifier, ...relativeFiles], {
      cwd: projectRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", (error) => resolve({ shardIndex, status: -1, stdout, stderr: `${stderr}\n${error.message}` }));
    child.on("close", (status) => resolve({ shardIndex, status, stdout, stderr }));
  });
}

const requested = process.argv.slice(2);
const files = requested.length
  ? requested.map((file) => path.resolve(projectRoot, file))
  : await collect(sessionsRoot);
const requestedShards = Number.parseInt(process.env.EXAMPLE_SHARDS ?? "8", 10);
const shardCount = Math.max(1, Math.min(Number.isFinite(requestedShards) ? requestedShards : 8, files.length));
const shards = Array.from({ length: shardCount }, () => []);
files.forEach((file, index) => shards[index % shardCount].push(file));

const results = await Promise.all(shards.map((shard, index) => runShard(shard, index)));
const totals = { files: 0, executed: 0, passed: 0, failed: 0, skipped: 0, shards: shardCount };
let parseFailures = 0;
for (const result of results.sort((left, right) => left.shardIndex - right.shardIndex)) {
  const lines = result.stdout.trim().split(/\r?\n/).filter(Boolean);
  let summary;
  try {
    summary = JSON.parse(lines[0] ?? "");
  } catch {
    parseFailures += 1;
  }
  if (summary) {
    totals.files += summary.files ?? 0;
    totals.executed += summary.executed ?? 0;
    totals.passed += summary.passed ?? 0;
    totals.failed += summary.failed ?? 0;
    totals.skipped += summary.skipped ?? 0;
  }
  if (result.status !== 0 || !summary || (summary.failed ?? 0) > 0) {
    console.error(`shard=${result.shardIndex}|status=${result.status}`);
    if (result.stderr.trim()) console.error(result.stderr.trim());
    for (const line of lines.slice(1)) console.error(line);
  }
}

console.log(JSON.stringify({ ...totals, parseFailures }));
if (totals.failed || parseFailures || results.some((result) => result.status !== 0)) process.exitCode = 1;
