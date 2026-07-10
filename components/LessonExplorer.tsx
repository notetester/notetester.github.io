"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type ExplorerTrack = {
  id: string;
  label: string;
  shortLabel: string;
  color: string;
};

export type ExplorerLesson = {
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  level: string;
  duration: string;
  track: string;
  keywords: string[];
};

export function LessonExplorer({
  lessons,
  tracks,
}: {
  lessons: ExplorerLesson[];
  tracks: ExplorerTrack[];
}) {
  const [query, setQuery] = useState("");
  const [track, setTrack] = useState("all");

  const visibleLessons = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ko");
    return lessons.filter((lesson) => {
      const trackMatches = track === "all" || lesson.track === track;
      if (!trackMatches) return false;
      if (!normalized) return true;
      const haystack = [
        lesson.title,
        lesson.eyebrow,
        lesson.summary,
        ...lesson.keywords,
      ]
        .join(" ")
        .toLocaleLowerCase("ko");
      return haystack.includes(normalized);
    });
  }, [lessons, query, track]);

  return (
    <section className="explorer" id="lessons" aria-labelledby="explorer-title">
      <div className="section-heading">
        <div>
          <p className="kicker">필요한 것만 바로 찾기</p>
          <h2 id="explorer-title">학습자료 탐색</h2>
        </div>
        <p>용어, 기술, 궁금한 동작을 검색하면 관련 학습자료만 남습니다.</p>
      </div>

      <div className="search-box">
        <label htmlFor="lesson-search">무엇이 궁금한가요?</label>
        <div className="search-box__field">
          <span aria-hidden="true">⌕</span>
          <input
            id="lesson-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="예: 세션, JPA 변경 감지, RAG 청킹, Docker 배포"
            type="search"
            value={query}
          />
          <strong aria-atomic="true" aria-live="polite" role="status">
            {visibleLessons.length}개
          </strong>
        </div>
      </div>

      <div className="filter-row" aria-label="학습 분야 필터" role="group">
        <button
          aria-pressed={track === "all"}
          className={track === "all" ? "is-active" : ""}
          onClick={() => setTrack("all")}
          type="button"
        >
          전체
        </button>
        {tracks.map((item) => (
          <button
            aria-pressed={track === item.id}
            className={track === item.id ? "is-active" : ""}
            key={item.id}
            onClick={() => setTrack(item.id)}
            style={{ "--track-color": item.color } as React.CSSProperties}
            type="button"
          >
            {item.shortLabel}
          </button>
        ))}
      </div>

      {visibleLessons.length ? (
        <div className="lesson-grid">
          {visibleLessons.map((lesson) => {
            const lessonTrack = tracks.find((item) => item.id === lesson.track);
            return (
              <article className="lesson-card" key={lesson.slug}>
                <div className="lesson-card__meta">
                  <span
                    className="track-dot"
                    style={{ background: lessonTrack?.color }}
                  />
                  {lesson.eyebrow}
                </div>
                <h3>
                  <Link href={`/learn/${lesson.slug}/`}>{lesson.title}</Link>
                </h3>
                <p>{lesson.summary}</p>
                <div className="lesson-card__footer">
                  <span>{lesson.level}</span>
                  <span>{lesson.duration}</span>
                  <span className="lesson-card__action" aria-hidden="true">학습하기 →</span>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <strong>검색 결과가 없습니다.</strong>
          <p>조금 더 짧은 단어로 검색하거나 전체 분야를 선택해 보세요.</p>
        </div>
      )}
    </section>
  );
}
