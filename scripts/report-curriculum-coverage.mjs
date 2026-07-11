import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const research = path.join(root, "research");
const sessionsRoot = path.join(root, "content", "curriculum", "sessions");

async function collectSessionFiles(directory) {
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error.code === "ENOENT") return []; throw error; }
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectSessionFiles(target));
    if (entry.isFile() && entry.name.endsWith(".ts")) files.push(target);
  }
  return files;
}

const inventoryFiles = (await readdir(research))
  .filter((name) => /^inventory-.*\.json$/.test(name))
  .sort();
const proposed = [];
for (const name of inventoryFiles) {
  const inventory = JSON.parse(await readFile(path.join(research, name), "utf8"));
  for (const course of inventory.courses ?? []) {
    for (const moduleData of course.modules ?? []) {
      for (const session of moduleData.sessions ?? []) {
        proposed.push({ id: session.id, title: session.title, inventory: name, course: course.id, module: moduleData.id });
      }
    }
  }
}

const authored = [];
for (const file of await collectSessionFiles(sessionsRoot)) {
  const imported = await import(`${pathToFileURL(file).href}?coverage=${Date.now()}`);
  const session = imported.default ?? imported.session;
  for (const id of session.inventoryIds ?? []) authored.push({ id, slug: session.slug, courseId: session.courseId });
}

const proposedById = new Map(proposed.map((item) => [item.id, item]));
const authoredIds = new Set(authored.map((item) => item.id));
const duplicates = authored.filter((item, index) => authored.findIndex((other) => other.id === item.id) !== index);
const unknown = authored.filter((item) => !proposedById.has(item.id));
const pending = proposed.filter((item) => !authoredIds.has(item.id));
const byInventory = inventoryFiles.map((inventory) => {
  const scoped = proposed.filter((item) => item.inventory === inventory);
  return { inventory, proposed: scoped.length, authored: scoped.filter((item) => authoredIds.has(item.id)).length };
});
const report = {
  proposed: proposed.length,
  authored: authoredIds.size,
  pending: pending.length,
  percent: proposed.length ? Number((authoredIds.size / proposed.length * 100).toFixed(2)) : 0,
  byInventory,
  duplicates,
  unknown,
  pendingSessions: pending.map(({ id, title, course, module }) => ({ id, title, course, module })),
};

await writeFile(path.join(research, "curriculum-coverage.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ proposed: report.proposed, authored: report.authored, pending: report.pending, percent: report.percent, duplicates: duplicates.length, unknown: unknown.length }));
if (duplicates.length || unknown.length) process.exitCode = 1;
