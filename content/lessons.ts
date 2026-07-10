import { aiProjectLessons } from "./lessons-ai-projects";
import { foundationLessons } from "./lessons-foundations";
import { fullstackLessons } from "./lessons-fullstack";
import { trackMap } from "./tracks";
import type { Lesson } from "./types";

export const allLessons: Lesson[] = [
  ...foundationLessons,
  ...fullstackLessons,
  ...aiProjectLessons,
].sort((a, b) => {
  const trackDifference = trackMap[a.track].order - trackMap[b.track].order;
  return trackDifference || a.order - b.order;
});

export const lessonBySlug = new Map(
  allLessons.map((lesson) => [lesson.slug, lesson]),
);
