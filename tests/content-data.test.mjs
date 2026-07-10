import assert from "node:assert/strict";
import test from "node:test";
import { foundationLessons } from "../content/lessons-foundations.ts";
import { fullstackLessons } from "../content/lessons-fullstack.ts";
import { aiProjectLessons } from "../content/lessons-ai-projects.ts";

const lessons = [...foundationLessons, ...fullstackLessons, ...aiProjectLessons];
const expectedSlugs = [
  "html-document-flow", "css-cascade-layout", "javascript-dom-events", "jquery-to-modern-dom",
  "xml-data-format", "java-language-basics", "java-oop-collections", "servlet-jsp-request-lifecycle",
  "relational-sql-mysql-oracle", "spring-core-di", "spring-mvc-request-flow", "mybatis-mapping",
  "jpa-entity-lifecycle", "spring-boot-autoconfiguration", "react-components-state", "jwt-auth-flow",
  "github-actions-docker-aws", "python-data-foundations", "numpy-pandas-preprocessing",
  "machine-learning-workflow", "deep-learning-neural-network", "langchain-rag-pipeline",
  "career-tuner-architecture", "lcb-legacy-modernization", "triptogether-domain-collaboration",
];

test("contains the complete curriculum without duplicate slugs", () => {
  const slugs = lessons.map((lesson) => lesson.slug);
  assert.equal(lessons.length, 25);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.deepEqual([...slugs].sort(), [...expectedSlugs].sort());
});

test("keeps every lesson independently useful and internally linked", () => {
  const slugs = new Set(lessons.map((lesson) => lesson.slug));
  for (const lesson of lessons) {
    assert.ok(lesson.sections.length >= 4 && lesson.sections.length <= 6, lesson.slug);
    assert.ok(lesson.sections.filter((section) => section.code).length >= 2, lesson.slug);
    assert.ok(lesson.sections.some((section) => section.result), lesson.slug);
    assert.equal(new Set(lesson.sections.map((section) => section.id)).size, lesson.sections.length, lesson.slug);
    assert.ok(lesson.checkpoints.length >= 3, lesson.slug);
    assert.ok(lesson.sources.length >= 1, lesson.slug);
    for (const related of lesson.related) assert.ok(slugs.has(related), `${lesson.slug} -> ${related}`);
  }
});

test("publishes only safe, public-facing source references", () => {
  for (const lesson of lessons) {
    for (const source of lesson.sources) {
      assert.match(source.repository, /^https:\/\//, lesson.slug);
      assert.doesNotMatch(source.repository, /BACKUP_/i, lesson.slug);
      assert.doesNotMatch(source.repository, /github\.com\/notetester\/(CareerTuner|TripTogether)(?:\/|$)/i, lesson.slug);
    }
  }
});
