import assert from "node:assert/strict";
import test from "node:test";
import { courseMetaById } from "../content/curriculum/course-meta.ts";
import { detailedSessions } from "../content/curriculum/session-index.ts";

test("publishes every detailed session in a known course with a unique slug", () => {
  const slugs = detailedSessions.map((session) => session.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const session of detailedSessions) {
    assert.ok(courseMetaById.has(session.courseId), `${session.slug}: unknown course ${session.courseId}`);
    assert.equal(session.schemaVersion, 2, session.slug);
  }
});

test("keeps detailed sessions independently useful", () => {
  for (const session of detailedSessions) {
    assert.ok(session.chapters.length >= 7, session.slug);
    assert.ok(session.chapters.flatMap((chapter) => chapter.codeExamples).length >= 2, session.slug);
    assert.ok(session.chapters.flatMap((chapter) => chapter.diagnostics).length >= 2, session.slug);
    assert.ok(session.exercises.some((exercise) => exercise.difficulty === "따라하기"), session.slug);
    assert.ok(session.exercises.some((exercise) => exercise.difficulty === "응용"), session.slug);
    assert.ok(session.exercises.some((exercise) => exercise.difficulty === "설계"), session.slug);
    assert.ok(session.sources.length > 0, session.slug);
  }
});

test("never exposes backup or private project links from detailed sessions", () => {
  for (const session of detailedSessions) {
    for (const source of session.sources) {
      assert.doesNotMatch(source.publicUrl ?? "", /BACKUP_/i, session.slug);
      assert.doesNotMatch(source.publicUrl ?? "", /github\.com\/notetester\/(CareerTuner|TripTogether)(?:\/|$)/i, session.slug);
    }
  }
});
