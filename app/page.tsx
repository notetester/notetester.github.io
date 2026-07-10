import type { Metadata } from "next";
import Link from "next/link";
import { LessonExplorer } from "@/components/LessonExplorer";
import { allLessons } from "@/content/lessons";
import { projectHighlights } from "@/content/projectHighlights";
import { tracks } from "@/content/tracks";

export const metadata: Metadata = {
  title: "개발 학습 아카이브",
  description:
    "HTML부터 Java, Spring, React, Python, ML, DL, LangChain RAG까지 코드와 실행 결과로 다시 배우는 학습 사이트입니다.",
};

export default function Home() {
  const explorerLessons = allLessons.map((lesson) => ({
    slug: lesson.slug,
    title: lesson.title,
    eyebrow: lesson.eyebrow,
    summary: lesson.summary,
    level: lesson.level,
    duration: lesson.duration,
    track: lesson.track,
    keywords: lesson.keywords,
  }));

  return (
    <main id="main-content">
      <section className="archive-hero">
        <div className="archive-hero__copy">
          <p className="edition-label">PERSONAL STUDY ARCHIVE · 2026</p>
          <h1>
            배웠던 개발 지식을
            <br />
            <em>다시 연결하는 곳</em>
          </h1>
          <p className="archive-hero__lead">
            “분명 배웠는데 정확히 뭐였지?”라는 순간을 위해 만들었습니다.
            개념만 읽고 끝나지 않도록 실제 코드, 실행 결과, 앞뒤 지식의 연결까지
            한 페이지에서 확인하세요.
          </p>
          <div className="hero-actions">
            <a className="button button--primary" href="#lessons">
              궁금한 내용 검색하기
            </a>
            <Link className="button button--ghost" href="/roadmap/">
              처음부터 순서대로 보기
            </Link>
          </div>
          <dl className="hero-stats">
            <div>
              <dt>{allLessons.length}</dt>
              <dd>상세 학습자료</dd>
            </div>
            <div>
              <dt>{tracks.length}</dt>
              <dd>연결된 학습 분야</dd>
            </div>
            <div>
              <dt>3</dt>
              <dd>실전 프로젝트</dd>
            </div>
          </dl>
        </div>

        <div className="archive-hero__map" aria-label="전체 학습 흐름">
          <div className="map-caption">
            <span>LEARNING MAP</span>
            <strong>기초에서 AI까지</strong>
          </div>
          {tracks.map((track, index) => (
            <Link
              className="map-step"
              href={`/roadmap/#${track.id}`}
              key={track.id}
              style={{ "--track-color": track.color } as React.CSSProperties}
            >
              <span>{track.icon}</span>
              <div>
                <small>STEP {String(index + 1).padStart(2, "0")}</small>
                <strong>{track.label}</strong>
                <p>{track.shortLabel}</p>
              </div>
              <b aria-hidden="true">↗</b>
            </Link>
          ))}
        </div>
      </section>

      <section className="how-to-use" aria-labelledby="how-title">
        <div className="section-heading section-heading--light">
          <div>
            <p className="kicker">이 사이트를 쓰는 세 가지 방법</p>
            <h2 id="how-title">지금 필요한 방식으로 시작하세요</h2>
          </div>
        </div>
        <div className="use-grid">
          <article>
            <span>⌕</span>
            <h3>용어 하나만 빠르게</h3>
            <p>검색으로 관련 수업을 찾고, 페이지 안 목차에서 원하는 설명으로 바로 이동합니다.</p>
          </article>
          <article>
            <span>↳</span>
            <h3>앞뒤 개념까지 연결</h3>
            <p>선행 개념과 다음 학습 링크를 따라가며 “왜 필요한지”까지 함께 이해합니다.</p>
          </article>
          <article>
            <span>▶</span>
            <h3>코드와 결과로 확인</h3>
            <p>복사할 수 있는 예제와 실제 실행 결과를 나란히 보며 동작을 머릿속에 다시 그립니다.</p>
          </article>
        </div>
      </section>

      <LessonExplorer
        lessons={explorerLessons}
        tracks={tracks.map(({ id, label, shortLabel, color }) => ({
          id,
          label,
          shortLabel,
          color,
        }))}
      />

      <section className="track-overview" aria-labelledby="track-title">
        <div className="section-heading">
          <div>
            <p className="kicker">전체 흐름 한눈에 보기</p>
            <h2 id="track-title">지식은 계단이 아니라 연결망입니다</h2>
          </div>
          <p>각 분야를 순서대로 보거나, 이미 아는 부분을 건너뛰고 필요한 지점에서 시작할 수 있습니다.</p>
        </div>
        <div className="track-list">
          {tracks.map((track) => {
            const count = allLessons.filter((lesson) => lesson.track === track.id).length;
            return (
              <article key={track.id} id={track.id}>
                <span className="track-list__number" style={{ color: track.color }}>
                  {track.icon}
                </span>
                <div>
                  <h3>{track.label}</h3>
                  <p>{track.description}</p>
                </div>
                <div className="track-list__action">
                  <strong>{count}개 자료</strong>
                  <Link href={`/roadmap/#${track.id}`}>순서 보기 →</Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="project-preview" aria-labelledby="project-title">
        <div className="section-heading section-heading--light">
          <div>
            <p className="kicker">코드가 제품이 되었을 때</p>
            <h2 id="project-title">프로젝트에서 개념을 다시 꺼내기</h2>
          </div>
          <Link href="/projects/">프로젝트 학습 전체 보기 →</Link>
        </div>
        <div className="project-preview__grid">
          {projectHighlights.map((project, index) => (
            <article key={project.slug}>
              <span>PROJECT 0{index + 1}</span>
              <h3>{project.name}</h3>
              <strong>{project.role}</strong>
              <p>{project.description}</p>
              <Link href={`/learn/${project.lesson}/`}>개념으로 다시 보기 →</Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
