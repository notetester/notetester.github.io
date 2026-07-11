import { readdir, stat, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const devRoot = "D:\\dev";
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const groups = [
  {
    id: "web-java",
    roots: ["webstudy", "javastudy", "javastudy2", "jspstudy"],
  },
  {
    id: "database-spring",
    roots: ["dbstudy", "SPRING", "springmvc", "springboot", "2026-springmvc01", "2026-spring-jpa-test"],
  },
  {
    id: "react-security-devops",
    roots: [
      "REACT",
      "my-app01",
      "my-app02",
      "my-app03",
      "my-app04-cicd",
      "my-app05-cicd",
      "2026-myapp05-cicd",
      "2026-myproject04-cicd",
      "github-action-basic",
    ],
  },
  {
    id: "python-ai",
    roots: [
      "python-basic",
      "pythonbasic",
      "python-basic-notes",
      "anaconda_projects",
      "2026_ML",
      "2026-DL",
      "2026_LangChain_RAG",
      "coachbot",
    ],
  },
  {
    id: "git-and-practice",
    roots: ["gitstudy", "GITSTUDY-main", "2026-gitstudy", "GITTEST", "2025-12-30"],
  },
  {
    id: "project-concepts",
    roots: [
      "CareerTuner",
      "CareerTunerAI",
      "CareerTunerAIDocs",
      "CareerTunerLearning",
      "CareerTunerPortfolio",
      "LCB",
      "LCBPortfolio",
      "TripTogether",
      "TripTogetherLearning",
      "TripTogetherDemo",
      "TripTogetherPortfolio",
      "TripTogether-portfolio",
    ],
  },
];

const ignoredDirectories = new Set([
  ".git",
  ".gradle",
  ".idea",
  ".next",
  ".nuxt",
  ".pytest_cache",
  ".venv",
  ".vinext",
  ".wrangler",
  "__pycache__",
  "build",
  "coverage",
  "dist",
  "logs",
  "node_modules",
  "out",
  "target",
  "venv",
]);

const generatedExtensions = new Set([".class", ".pyc", ".pyo", ".o", ".obj", ".dll", ".exe"]);
const binaryExtensions = new Set([
  ".7z", ".avi", ".db", ".doc", ".docx", ".gif", ".gz", ".h5", ".ico", ".jar",
  ".jpeg", ".jpg", ".keras", ".mp3", ".mp4", ".npy", ".pdf", ".png", ".ppt", ".pptx",
  ".tar", ".webp", ".xls", ".xlsx", ".zip",
]);

function normalize(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function classify(extension) {
  if (generatedExtensions.has(extension)) return "generated";
  if (binaryExtensions.has(extension)) return "binary-or-data";
  return "source-or-document";
}

async function walk(rootPath, relative = "") {
  const directory = path.join(rootPath, relative);
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    return [{ path: normalize(relative), kind: "unreadable", error: error.code ?? String(error) }];
  }

  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, "ko"))) {
    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) continue;
      files.push(...await walk(rootPath, path.join(relative, entry.name)));
      continue;
    }
    if (!entry.isFile()) continue;
    const relativePath = path.join(relative, entry.name);
    const extension = path.extname(entry.name).toLowerCase();
    const info = await stat(path.join(rootPath, relativePath));
    files.push({
      path: normalize(relativePath),
      extension: extension || "[none]",
      bytes: info.size,
      kind: classify(extension),
    });
  }
  return files;
}

const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  policy: {
    ignoredDirectories: [...ignoredDirectories].sort(),
    note: "Generated and binary files remain counted for provenance but are not treated as lesson source text.",
  },
  totals: { roots: 0, files: 0, sourceOrDocument: 0, binaryOrData: 0, generated: 0, unreadable: 0 },
  groups: [],
};

for (const group of groups) {
  const groupResult = { id: group.id, totals: { roots: 0, files: 0 }, roots: [] };
  for (const rootName of group.roots) {
    const rootPath = path.join(devRoot, rootName);
    const files = await walk(rootPath);
    const extensionCounts = Object.fromEntries(
      [...files.reduce((map, file) => map.set(file.extension ?? "[error]", (map.get(file.extension ?? "[error]") ?? 0) + 1), new Map())]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    );
    const kindCounts = Object.fromEntries(
      [...files.reduce((map, file) => map.set(file.kind, (map.get(file.kind) ?? 0) + 1), new Map())]
        .sort((a, b) => a[0].localeCompare(b[0])),
    );
    groupResult.roots.push({ root: rootName, totals: { files: files.length }, extensionCounts, kindCounts, files });
    groupResult.totals.roots += 1;
    groupResult.totals.files += files.length;
    output.totals.roots += 1;
    output.totals.files += files.length;
    output.totals.sourceOrDocument += kindCounts["source-or-document"] ?? 0;
    output.totals.binaryOrData += kindCounts["binary-or-data"] ?? 0;
    output.totals.generated += kindCounts.generated ?? 0;
    output.totals.unreadable += kindCounts.unreadable ?? 0;
  }
  output.groups.push(groupResult);
}

await mkdir(path.join(projectRoot, "research"), { recursive: true });
const outputPath = path.join(projectRoot, "research", "source-manifest.json");
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(JSON.stringify(output.totals));
