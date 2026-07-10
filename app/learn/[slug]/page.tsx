import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodePanel } from "@/components/CodePanel";
import { CompletionButton } from "@/components/CompletionButton";
import { allLessons, lessonBySlug } from "@/content/lessons";
import { sourceHref } from "@/content/sourceLinks";
import { trackMap } from "@/content/tracks";

type LessonPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return allLessons.map((lesson) => ({ slug: lesson.slug }));
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { slug } = await params;
  const lesson = lessonBySlug.get(slug);

  if (!lesson) return {};

  return {
    title: lesson.title,
    description: lesson.summary,
    keywords: lesson.keywords,
    alternates: { canonical: `/learn/${lesson.slug}/` },
    openGraph: {
      title: lesson.title,
      description: lesson.summary,
      url: `/learn/${lesson.slug}/`,
    },
  };
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { slug } = await params;
  const lesson = lessonBySlug.get(slug);
  if (!lesson) notFound();

  const track = trackMap[lesson.track];
  const related = lesson.related
    .map((relatedSlug) => lessonBySlug.get(relatedSlug))
    .filter((item) => item !== undefined);
  const heroStyle = { "--lesson-color": track.color } as CSSProperties;

  return (
    <main id="main-content">
      <header className="lesson-hero" style={heroStyle}>
        <nav className="breadcrumbs" aria-label="현재 위치">
          <Link href="/">홈</Link>
          <span>{track.label}</span>
          <span>{lesson.title}</span>
        </nav>
        <div className="lesson-hero__grid">
          <div>
            <p className="kicker">{lesson.eyebrow}</p>
            <h1>{lesson.title}</h1>
            <p className="lesson-hero__summary">{lesson.summary}</p>
          </div>
          <dl className="lesson-facts">
            <div><dt>과정</dt><dd>{track.shortLabel}</dd></div>
            <div><dt>난이도</dt><dd>{lesson.level}</dd></div>
            <div><dt>예상 시간</dt><dd>{lesson.duration}</dd></div>
            <div><dt>핵심어</dt><dd>{lesson.keywords.slice(0, 3).join(" · ")}</dd></div>
          </dl>
        </div>
      </header>

      <div className="lesson-layout" style={heroStyle}>
        <nav className="lesson-toc" aria-label="이 수업의 목차">
          <h2>이 수업에서 볼 것</h2>
          <ol>
            {lesson.sections.map((section, index) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="lesson-body">
          <div className="why-box">
            <strong>왜 이 개념을 배우나요?</strong>
            <p>{lesson.why}</p>
          </div>

          {lesson.sections.map((section, index) => (
            <section className="lesson-section" id={section.id} key={section.id}>
              <span className="lesson-section__number">
                SECTION {String(index + 1).padStart(2, "0")}
              </span>
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.bullets?.length ? (
                <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
              ) : null}
              {section.code ? <CodePanel example={section.code} /> : null}
              {section.result ? (
                <div className="result-panel">
                  <strong>▶ {section.result.label}</strong>
                  <pre>{section.result.output}</pre>
                  {section.result.explanation ? <p>{section.result.explanation}</p> : null}
                </div>
              ) : null}
              {section.tip ? (
                <aside className="tip-box"><strong>기억해 두기</strong>{section.tip}</aside>
              ) : null}
            </section>
          ))}

          <section className="lesson-end">
            <h2>여기까지 이해했다면</h2>
            <ul className="checkpoint-list">
              {lesson.checkpoints.map((checkpoint) => <li key={checkpoint}>{checkpoint}</li>)}
            </ul>
            {related.length ? (
              <div className="related-grid">
                {related.map((item) => (
                  <Link href={`/learn/${item.slug}/`} key={item.slug}>{item.title} →</Link>
                ))}
              </div>
            ) : null}
          </section>
        </article>

        <aside className="lesson-aside">
          <CompletionButton slug={lesson.slug} />
          <div className="aside-block">
            <h2>먼저 알면 좋아요</h2>
            {lesson.prerequisites.length ? (
              <ul>{lesson.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul>
            ) : <p>별도 선수 지식이 없습니다.</p>}
          </div>
          <div className="aside-block">
            <h2>헷갈리는 용어</h2>
            <Link href="/glossary/">용어 사전에서 확인 →</Link>
          </div>
          <div className="aside-block">
            <h2>학습 근거</h2>
            <ul>
              {lesson.sources.map((source) => (
                <li key={`${source.repository}-${source.path ?? ""}`}>
                  <a href={sourceHref(source)} rel="noreferrer" target="_blank">{source.label} ↗</a>
                  {source.path ? <small>{source.path}</small> : null}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
