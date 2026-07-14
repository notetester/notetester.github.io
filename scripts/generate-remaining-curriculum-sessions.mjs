import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const devRoot = path.resolve(root, "..");
const researchRoot = path.join(root, "research");
const sessionsRoot = path.join(root, "content", "curriculum", "sessions");

const inventories = [
  JSON.parse(await readFile(path.join(researchRoot, "inventory-fullstack.json"), "utf8")),
  JSON.parse(await readFile(path.join(researchRoot, "inventory-python-ai.json"), "utf8")),
];

const rows = [];
for (const inventory of inventories) {
  for (const course of inventory.courses ?? []) {
    for (const moduleData of course.modules ?? []) {
      for (const [index, session] of (moduleData.sessions ?? []).entries()) {
        rows.push({ course, moduleData, session, index });
      }
    }
  }
}
const byId = new Map(rows.map((row) => [row.session.id, row]));

function cleanText(value) {
  return String(value ?? "")
    .replaceAll(/https?:\/\/\S+/gi, "[공개 URL 생략]")
    .replaceAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[이메일 생략]")
    .replaceAll(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "[IP 생략]")
    .replaceAll(/(?:token|secret|password|passwd|client[_-]?secret)\s*[:=]\s*\S+/gi, "$1=[값 생략]")
    .slice(0, 600);
}

const sourceCache = new Map();
async function fingerprintSource(sourcePath) {
  const normalized = String(sourcePath).replaceAll("\\", "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("..")) return null;
  if (sourceCache.has(normalized)) return sourceCache.get(normalized);
  const absolute = path.resolve(devRoot, normalized);
  const relativeCheck = path.relative(devRoot, absolute);
  if (relativeCheck.startsWith("..") || path.isAbsolute(relativeCheck)) return null;
  try {
    const info = await stat(absolute);
    if (!info.isFile()) return null;
    const bytes = await readFile(absolute);
    const firstSlash = normalized.indexOf("/");
    const repositoryName = firstSlash === -1 ? normalized : normalized.slice(0, firstSlash);
    const relativePath = firstSlash === -1 ? path.basename(normalized) : normalized.slice(firstSlash + 1);
    const result = {
      repository: `D:/dev/${repositoryName}`,
      path: relativePath,
      lines: bytes.toString("utf8").split(/\r?\n/).length,
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex").toUpperCase(),
    };
    sourceCache.set(normalized, result);
    return result;
  } catch {
    sourceCache.set(normalized, null);
    return null;
  }
}

function mapLevel(level) {
  if (level === "초급") return "기초";
  if (["입문", "기초", "중급", "고급", "전문가"].includes(level)) return level;
  return "중급";
}

function siteCourse(row) {
  const id = row.course.id;
  if (id === "github-actions-docker-aws") return "devops";
  if (id === "coachbot-ai-case") return "projects";
  if (id === "expert-gap-roadmap") return row.moduleData.id === "gap-data-ai-production" ? "projects" : "python";
  return id;
}

function outputDirectory(courseId) {
  return {
    devops: "devops",
    python: "python",
    "machine-learning": "machine-learning",
    "deep-learning": "deep-learning",
    "langchain-rag": "langchain-rag",
    projects: "projects",
  }[courseId];
}

async function localSourcesFor(row) {
  const result = [];
  for (const sourcePath of row.session.sourceFiles ?? []) {
    const source = await fingerprintSource(sourcePath);
    if (source && !result.some((item) => item.repository === source.repository && item.path === source.path)) result.push(source);
  }
  return result;
}

function notesFor(row, localSources) {
  const declared = (row.session.sourceFiles ?? []).length;
  const notes = [
    ...(row.session.executionEvidence ?? []).map(cleanText),
    ...(row.session.codeExamples ?? []).map((item) => `원본 예제 의도: ${cleanText(item)}`),
  ].filter(Boolean);
  if (declared > localSources.length) notes.push(`인벤토리에 선언된 원본 ${declared}개 중 현재 snapshot에서 ${localSources.length}개만 fingerprint했으므로 누락 파일의 동작을 추정하지 않습니다.`);
  return notes.length ? notes : ["직접 원본 파일이 없는 전문가 보강 항목이므로 공식 1차 문서, synthetic model과 실제 integration lab의 적용 범위를 분리합니다."];
}

function expertNotesFor(row) {
  const notes = (row.session.expertNotes ?? []).map(cleanText).filter(Boolean);
  return notes.length ? notes : ["교육용 최소 예제의 성공을 production 품질이나 현재 library/provider 보장으로 과장하지 않습니다."];
}

const actionIds = rows.filter((row) => row.course.id === "github-actions-docker-aws").map((row) => row.session.id);
const gapRuntimeIds = rows.filter((row) => row.course.id === "expert-gap-roadmap" && row.moduleData.id !== "gap-data-ai-production").map((row) => row.session.id);
const mlIds = rows.filter((row) => row.course.id === "machine-learning").map((row) => row.session.id);
const dlIds = rows.filter((row) => row.course.id === "deep-learning").map((row) => row.session.id);
const ragIds = rows.filter((row) => row.course.id === "langchain-rag").map((row) => row.session.id);
const coachIds = rows.filter((row) => row.course.id === "coachbot-ai-case").map((row) => row.session.id);
const gapDataIds = rows.filter((row) => row.course.id === "expert-gap-roadmap" && row.moduleData.id === "gap-data-ai-production").map((row) => row.session.id);

const sequences = [
  { ids: actionIds, prerequisite: "security-21-full-security-capstone", nextAfter: "python-001-output-names-types" },
  { ids: gapRuntimeIds, prerequisite: "python-040-venv-requirements-unittest-pytest", nextAfter: mlIds[0] },
  { ids: mlIds, prerequisite: gapRuntimeIds.at(-1), nextAfter: dlIds[0] },
  { ids: dlIds, prerequisite: mlIds.at(-1), nextAfter: ragIds[0] },
  { ids: ragIds, prerequisite: dlIds.at(-1), nextAfter: coachIds[0] },
  { ids: coachIds, prerequisite: ragIds.at(-1), nextAfter: gapDataIds[0] },
  { ids: gapDataIds, prerequisite: coachIds.at(-1), nextAfter: undefined },
];
const chain = new Map();
for (const sequence of sequences) {
  for (const [index, id] of sequence.ids.entries()) {
    chain.set(id, {
      prerequisiteSlugs: [index === 0 ? sequence.prerequisite : sequence.ids[index - 1]].filter(Boolean),
      nextSlug: sequence.ids[index + 1] ?? sequence.nextAfter,
    });
  }
}

function wrapperSource(spec) {
  return `import { createInventoryExpertSession } from "../../session-builders/create-inventory-expert-session.ts";\n\nexport default createInventoryExpertSession(${JSON.stringify(spec, null, 2)});\n`;
}

async function writeSpecFile(directory, filename, spec) {
  const targetDirectory = path.join(sessionsRoot, directory);
  await mkdir(targetDirectory, { recursive: true });
  await writeFile(path.join(targetDirectory, filename), wrapperSource(spec), "utf8");
}

const selected = rows.filter((row) => [
  "github-actions-docker-aws",
  "machine-learning",
  "deep-learning",
  "langchain-rag",
  "coachbot-ai-case",
  "expert-gap-roadmap",
].includes(row.course.id));

let generated = 0;
for (const row of selected) {
  const courseId = siteCourse(row);
  const directory = outputDirectory(courseId);
  const localSources = await localSourcesFor(row);
  const links = chain.get(row.session.id) ?? { prerequisiteSlugs: row.session.prerequisites ?? [], nextSlug: undefined };
  const spec = {
    inventoryId: row.session.id,
    slug: row.session.id,
    courseId,
    moduleId: row.moduleData.id,
    order: row.index + 1,
    title: row.session.title,
    level: mapLevel(row.session.level ?? row.moduleData.level),
    estimatedMinutes: row.session.estimatedMinutes ?? row.session.minutes ?? 180,
    concepts: (row.session.concepts ?? []).map(cleanText).filter(Boolean),
    localSources,
    sourceNotes: notesFor(row, localSources),
    expertNotes: expertNotesFor(row),
    prerequisiteSlugs: links.prerequisiteSlugs,
    nextSlug: links.nextSlug,
  };
  await writeSpecFile(directory, `${row.session.id}.ts`, spec);
  generated += 1;
}

const securitySpecs = [
  {
    sourceInventoryId: "oauth-03-kakao-naver-provider",
    inventoryId: "oauth-03-kakao-naver-provider",
    slug: "security-17-kakao-naver-provider-integration",
    order: 2,
    title: "Kakao·Naver provider adapter와 canonical identity",
    concepts: ["provider adapter", "authorization token exchange", "canonical provider subject", "profile schema", "scope minimization", "unlink webhook", "provider outage contract"],
    prerequisiteSlugs: ["security-16-oauth-authorization-code-pkce"],
    nextSlug: "security-18-account-linking-state-redirect",
  },
  {
    sourceInventoryId: "oauth-02-state-pkce-redirect",
    inventoryId: "oauth-02-state-pkce-redirect",
    slug: "security-18-account-linking-state-redirect",
    order: 3,
    title: "명시적 account linking·state transaction·redirect 안전성",
    concepts: ["account linking", "explicit user consent", "reauthentication", "provider plus subject identity", "one-time state transaction", "exact redirect allowlist", "session fixation defense"],
    prerequisiteSlugs: ["security-17-kakao-naver-provider-integration"],
    nextSlug: "security-19-api-rate-limit-abuse",
  },
  {
    sourceInventoryId: "sec-12-axios-bearer-401",
    inventoryId: "sec-12-axios-bearer-401",
    slug: "security-19-api-rate-limit-abuse",
    order: 4,
    title: "API rate limit·abuse case·cost와 distributed quota",
    concepts: ["rate limiting", "token bucket", "abuse case", "Retry-After", "distributed counter", "resource cost budget", "fair client recovery"],
    prerequisiteSlugs: ["security-18-account-linking-state-redirect"],
    nextSlug: "security-20-secret-key-rotation-observability",
  },
  {
    sourceInventoryId: "sec-16-secret-config-redaction",
    inventoryId: "sec-16-secret-config-redaction",
    slug: "security-20-secret-key-rotation-observability",
    order: 5,
    title: "secret·key rotation·redaction·security observability",
    concepts: ["secret manager", "overlap key rotation", "configuration provenance", "redaction", "audit event", "security telemetry", "credential incident recovery"],
    prerequisiteSlugs: ["security-19-api-rate-limit-abuse"],
    nextSlug: "security-21-full-security-capstone",
  },
  {
    sourceInventoryId: "oauth-04-react-callback",
    inventoryId: "oauth-04-react-callback",
    slug: "security-21-full-security-capstone",
    order: 6,
    title: "인증·JWT·OAuth·인가·운영 full security capstone",
    concepts: ["threat model", "end-to-end authorization", "security regression", "incident containment", "credential rotation", "rollback reconciliation", "release evidence"],
    prerequisiteSlugs: ["security-20-secret-key-rotation-observability"],
    nextSlug: actionIds[0],
  },
];

for (const item of securitySpecs) {
  const row = byId.get(item.sourceInventoryId);
  if (!row) throw new Error(`Missing security inventory source ${item.sourceInventoryId}`);
  const localSources = await localSourcesFor(row);
  const spec = {
    inventoryId: item.inventoryId,
    slug: item.slug,
    courseId: "devops",
    moduleId: "oauth-api-hardening",
    order: item.order,
    title: item.title,
    level: "고급",
    estimatedMinutes: 220,
    concepts: item.concepts,
    localSources,
    sourceNotes: notesFor(row, localSources),
    expertNotes: expertNotesFor(row),
    prerequisiteSlugs: item.prerequisiteSlugs,
    nextSlug: item.nextSlug,
  };
  await writeSpecFile("devops", `${item.slug}.ts`, spec);
  generated += 1;
}

console.log(JSON.stringify({ generated, selectedInventorySessions: selected.length, securitySessions: securitySpecs.length, fingerprintedSources: sourceCache.size }));
