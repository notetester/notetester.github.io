import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { courseMeta } from "@/content/curriculum/course-meta";
import { detailedSessions } from "@/content/curriculum/session-index";
import { getModuleTitle } from "@/content/curriculum/module-meta";

export const metadata: Metadata = {
  title: "초급부터 전문가까지 정규 과정",
  description: "원본 학습 코드와 노트북을 세션 단위로 다시 감사해 만든 상세 개발 커리큘럼입니다.",
  alternates: { canonical: "/curriculum/" },
};

export default function CurriculumPage() {
  const totals = {
    sessions: detailedSessions.length,
    chapters: detailedSessions.reduce((sum, session) => sum + session.chapters.length, 0),
    examples: detailedSessions.reduce((sum, session) => sum + session.chapters.reduce((chapterSum, chapter) => chapterSum + chapter.codeExamples.length, 0), 0),
    diagnostics: detailedSessions.reduce((sum, session) => sum + session.chapters.reduce((chapterSum, chapter) => chapterSum + chapter.diagnostics.length, 0), 0),
  };

  return (
    <main id="main-content">
      <header className="page-hero curriculum-hero">
        <div className="page-hero__inner">
          <p className="kicker">BEGINNER TO EXPERT · SOURCE-AUDITED</p>
          <h1>한두 문단으로 끝내지 않는<br />정규 학습 과정</h1>
          <p>각 세션은 별도의 원본 감사와 집필·기술 검토를 거칩니다. 개념 정의에서 멈추지 않고 코드의 줄별 의미, 실행 결과의 원인, 실패 진단, 단계별 실습과 전문가 관점까지 한 페이지에서 독립적으로 이해할 수 있게 구성합니다.</p>
          <dl className="curriculum-stats">
            <div><dt>{totals.sessions}</dt><dd>원자 학습 세션</dd></div>
            <div><dt>{totals.chapters}</dt><dd>상세 설명 장</dd></div>
            <div><dt>{totals.examples}</dt><dd>재현 가능한 코드</dd></div>
            <div><dt>{totals.diagnostics}</dt><dd>오류 진단 사례</dd></div>
          </dl>
        </div>
      </header>

      <section className="curriculum-intro" aria-labelledby="curriculum-method-title">
        <div className="section-heading">
          <div><p className="kicker">HOW EACH SESSION IS BUILT</p><h2 id="curriculum-method-title">세션마다 같은 깊이 기준을 적용합니다</h2></div>
          <p>필요한 부분부터 열어도 앞의 설명을 읽지 않았다는 이유로 막히지 않게 선수 개념을 다시 짚고 깊은 링크를 제공합니다.</p>
        </div>
        <ol className="workflow-strip">
          <li><span>01</span><strong>원본 감사</strong><p>관련 코드·노트·노트북과 실행 흔적을 전부 확인합니다.</p></li>
          <li><span>02</span><strong>정신 모델</strong><p>무엇이 왜 필요한지와 내부 상태 변화를 먼저 설명합니다.</p></li>
          <li><span>03</span><strong>실행과 진단</strong><p>명령·입력·출력·오류를 원인과 함께 재현합니다.</p></li>
          <li><span>04</span><strong>적용과 검증</strong><p>세 단계 과제, 복습 질문, 출처 범위로 이해를 확인합니다.</p></li>
        </ol>
      </section>

      <section className="course-catalog" aria-labelledby="course-catalog-title">
        <div className="section-heading">
          <div><p className="kicker">COURSE CATALOG</p><h2 id="course-catalog-title">분야별 전체 과정</h2></div>
          <p>입문·기초·중급·고급·전문가 단계가 끊기지 않도록 모듈과 누적 실습을 연결합니다.</p>
        </div>
        <div className="course-catalog__list">
          {courseMeta.map((course) => {
            const sessions = detailedSessions.filter((session) => session.courseId === course.id);
            const moduleIds = [...new Set(sessions.map((session) => session.moduleId))];
            const style = { "--course-color": course.color } as CSSProperties;
            return (
              <article className="course-row" id={course.id} key={course.id} style={style}>
                <div className="course-row__number">{String(course.order).padStart(2, "0")}</div>
                <div className="course-row__copy">
                  <span>{course.shortTitle}</span>
                  <h2>{course.title}</h2>
                  <p>{course.description}</p>
                  <div className="course-row__modules">
                    {moduleIds.length ? moduleIds.map((moduleId) => <span key={moduleId}>{getModuleTitle(course.id, moduleId)}</span>) : <span>세션 인벤토리 검수 중</span>}
                  </div>
                </div>
                <div className="course-row__sessions">
                  <strong>{sessions.length}개 세션</strong>
                  <small>{sessions.reduce((sum, session) => sum + session.estimatedMinutes, 0)}분 · {moduleIds.length}개 모듈</small>
                  {sessions.length ? <Link href={`/curriculum/${course.id}/`}>전체 과정 열기 →</Link> : <span>준비 중</span>}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
