import type { CSSProperties } from "react";
import Link from "next/link";
import { allLessons } from "@/content/lessons";
import { tracks } from "@/content/tracks";

export const metadata = {
  title: "학습 지도",
  description: "HTML부터 RAG와 실전 프로젝트까지 이어지는 전체 개발 학습 순서입니다.",
};

export default function RoadmapPage() {
  return (
    <main className="page-shell" id="main-content">
      <header className="page-hero">
        <div className="page-hero__inner">
          <p className="kicker">LEARNING ROADMAP</p>
          <h1>길을 잃지 않는<br />전체 학습 지도</h1>
          <p>처음부터 순서대로 걸어도 되고, 지금 막힌 기술이 속한 과정으로 바로 들어가도 됩니다. 각 수업은 혼자 읽어도 이해되도록 필요한 앞 개념을 다시 설명합니다.</p>
        </div>
      </header>
      <div className="inner-page-content roadmap-grid">
        {tracks.map((track) => {
          const lessons = allLessons.filter((lesson) => lesson.track === track.id);
          const style = { "--track-color": track.color } as CSSProperties;
          return (
            <section className="roadmap-track" id={track.id} key={track.id} style={style}>
              <div className="roadmap-track__label">
                <span>{track.icon}</span>
                <h2>{track.label}</h2>
                <p>{track.description}</p>
              </div>
              <div className="roadmap-lessons">
                {lessons.map((lesson, index) => (
                  <Link className="roadmap-lesson" href={`/learn/${lesson.slug}/`} key={lesson.slug}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <span><strong>{lesson.title}</strong><small>{lesson.summary}</small></span>
                    <b>{lesson.duration} →</b>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
