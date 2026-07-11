import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { courseMeta, courseMetaById } from "@/content/curriculum/course-meta";
import { detailedSessions } from "@/content/curriculum/session-index";
import { getModuleMeta, getModuleTitle } from "@/content/curriculum/module-meta";

type CoursePageProps = { params: Promise<{ courseId: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return courseMeta.map((course) => ({ courseId: course.id }));
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { courseId } = await params;
  const course = courseMetaById.get(courseId);
  if (!course) return {};
  return { title: course.title, description: course.description, alternates: { canonical: `/curriculum/${courseId}/` } };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { courseId } = await params;
  const course = courseMetaById.get(courseId);
  if (!course) notFound();
  const sessions = detailedSessions.filter((session) => session.courseId === courseId);
  const modules = [...new Set(sessions.map((session) => session.moduleId))];
  const style = { "--lesson-color": course.color } as CSSProperties;

  return (
    <main id="main-content" className="course-detail" style={style}>
      <header className="lesson-hero course-detail__hero">
        <nav className="breadcrumbs" aria-label="현재 위치"><Link href="/">홈</Link><Link href="/curriculum/">정규 과정</Link><span>{course.title}</span></nav>
        <div className="lesson-hero__grid">
          <div><p className="kicker">COURSE {String(course.order).padStart(2, "0")} · BEGINNER TO EXPERT</p><h1>{course.title}</h1><p className="lesson-hero__summary">{course.description}</p></div>
          <dl className="lesson-facts"><div><dt>모듈</dt><dd>{modules.length}개</dd></div><div><dt>세션</dt><dd>{sessions.length}개</dd></div><div><dt>총 학습 시간</dt><dd>{Math.round(sessions.reduce((sum, session) => sum + session.estimatedMinutes, 0) / 60)}시간</dd></div><div><dt>난이도 범위</dt><dd>입문 → 전문가</dd></div></dl>
        </div>
      </header>

      <div className="course-detail__layout">
        <nav className="course-module-nav" aria-label="과정 모듈"><h2>과정 목차</h2>{modules.length ? <ol>{modules.map((moduleId, index) => <li key={moduleId}><a href={`#${moduleId}`}><span>{String(index + 1).padStart(2, "0")}</span>{getModuleTitle(courseId, moduleId)}</a></li>)}</ol> : <p>현재 세션을 검수하고 있습니다.</p>}</nav>
        <div className="course-modules">
          {modules.map((moduleId, moduleIndex) => {
            const moduleSessions = sessions.filter((session) => session.moduleId === moduleId).sort((left, right) => left.order - right.order);
            const metadata = getModuleMeta(courseId, moduleId);
            return <section id={moduleId} key={moduleId}>
              <header><span>MODULE {String(moduleIndex + 1).padStart(2, "0")}</span><h2>{getModuleTitle(courseId, moduleId)}</h2>{metadata ? <p>{metadata.description}</p> : null}<p>{moduleSessions.length}개 세션 · {moduleSessions.reduce((sum, session) => sum + session.estimatedMinutes, 0)}분</p></header>
              <ol className="module-session-list">{moduleSessions.map((session, index) => <li key={session.slug}>
                <Link href={`/curriculum/${courseId}/${session.slug}/`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div><small>{session.level} · {session.estimatedMinutes}분</small><h3>{session.title}</h3><p>{session.summary}</p><ul>{session.objectives.slice(0, 2).map((objective) => <li key={objective}>{objective}</li>)}</ul></div>
                  <b aria-hidden="true">→</b>
                </Link>
              </li>)}</ol>
            </section>;
          })}
          {!sessions.length ? <div className="empty-state"><strong>원본 인벤토리와 세션을 교차 검수하고 있습니다.</strong><p>개요 페이지로 압축하지 않고 각 세션의 코드와 결과를 독립적으로 검증한 뒤 순서대로 공개합니다.</p></div> : null}
        </div>
      </div>
    </main>
  );
}
