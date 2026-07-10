import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const outputRoot = new URL("../dist/client/", import.meta.url);

async function collectHtml(directory, relative = "") {
  const entries = await readdir(new URL(relative, directory), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = `${relative}${entry.name}`;
    if (entry.isDirectory()) files.push(...await collectHtml(directory, `${path}/`));
    else if (entry.name.endsWith(".html")) files.push(path);
  }
  return files;
}

test("exports the complete learning archive as static HTML", async () => {
  const [home, roadmap, glossary, projects, sources, sitemap] = await Promise.all([
    readFile(new URL("index.html", outputRoot), "utf8"),
    readFile(new URL("roadmap/index.html", outputRoot), "utf8"),
    readFile(new URL("glossary/index.html", outputRoot), "utf8"),
    readFile(new URL("projects/index.html", outputRoot), "utf8"),
    readFile(new URL("sources/index.html", outputRoot), "utf8"),
    readFile(new URL("sitemap.xml", outputRoot), "utf8"),
  ]);

  assert.match(home, /개발 학습 아카이브/);
  assert.match(home, /실제 코드, 실행 결과/);
  assert.match(home, /src="\/copy-code\.js"/);
  assert.match(roadmap, /전체 학습 지도/);
  assert.match(glossary, /DOM/);
  assert.match(projects, /CareerTuner/);
  assert.match(sources, /공개 학습 코드/);
  assert.match(sitemap, /learn\/langchain-rag-pipeline/);
});

test("exports every lesson and GitHub Pages control files", async () => {
  const lessons = await readdir(new URL("learn/", outputRoot), { withFileTypes: true });
  const lessonDirectories = lessons.filter((entry) => entry.isDirectory());
  assert.equal(lessonDirectories.length, 25);

  await Promise.all([
    access(new URL(".nojekyll", outputRoot)),
    access(new URL("robots.txt", outputRoot)),
    access(new URL("404.html", outputRoot)),
    access(new URL("copy-code.js", outputRoot)),
  ]);

  const rag = await readFile(new URL("learn/langchain-rag-pipeline/index.html", outputRoot), "utf8");
  assert.match(rag, /RAG/);
  assert.match(rag, /result-panel/);
  assert.match(rag, /data-copy-code/);
});

test("keeps every internal page link inside the static export", async () => {
  const htmlFiles = await collectHtml(outputRoot);
  const missing = [];

  for (const file of htmlFiles) {
    const html = await readFile(new URL(file, outputRoot), "utf8");
    assert.doesNotMatch(html, /(?:["'(=\s][A-Za-z]:\/|\/home\/runner\/)/, file);
    const links = [...html.matchAll(/href=["'](\/[^"'#?]*)/g)].map((match) => match[1]);
    for (const href of links) {
      if (href.startsWith("/_next/") || href === "/") continue;
      const relativeTarget = href.endsWith("/")
        ? `${href.slice(1)}index.html`
        : href.slice(1);
      try {
        await access(new URL(relativeTarget, outputRoot));
      } catch {
        missing.push(`${file} -> ${href}`);
      }
    }
  }

  assert.deepEqual(missing, []);
});
