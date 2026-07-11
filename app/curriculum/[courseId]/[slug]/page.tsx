import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CompletionButton } from "@/components/CompletionButton";
import { DetailedCodeExample } from "@/components/DetailedCodeExample";
import { courseMetaById } from "@/content/curriculum/course-meta";
import { detailedSessionBySlug, detailedSessions } from "@/content/curriculum/session-index";
import { getModuleTitle } from "@/content/curriculum/module-meta";

type SessionPageProps = {
  params: Promise<{ courseId: string; slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return detailedSessions.map((session) => ({ courseId: session.courseId, slug: session.slug }));
}

export async function generateMetadata({ params }: SessionPageProps): Promise<Metadata> {
  const { courseId, slug } = await params;
  const session = detailedSessionBySlug.get(slug);
  if (!session || session.courseId !== courseId) return {};
  return {
    title: session.title,
    description: session.summary,
    keywords: session.keywords,
    alternates: { canonical: `/curriculum/${courseId}/${slug}/` },
  };
}

export default async function DetailedSessionPage({ params }: SessionPageProps) {
  const { courseId, slug } = await params;
  const session = detailedSessionBySlug.get(slug);
  if (!session || session.courseId !== courseId) notFound();

  const course = courseMetaById.get(courseId);
  if (!course) notFound();
  const style = { "--lesson-color": course.color } as CSSProperties;
  const linkedSession = (targetSlug: string) => detailedSessionBySlug.get(targetSlug);

  return (
    <main id="main-content" className="deep-session" style={style}>
      <header className="lesson-hero deep-session__hero">
        <nav className="breadcrumbs" aria-label="현재 위치">
          <Link href="/">홈</Link>
          <Link href="/curriculum/">정규 과정</Link>
          <Link href={`/curriculum/#${course.id}`}>{course.shortTitle}</Link>
          <span>{session.title}</span>
        </nav>
        <div className="lesson-hero__grid">
          <div>
            <p className="kicker">{course.title} · {getModuleTitle(course.id, session.moduleId)}</p>
            <h1>{session.title}</h1>
            <p className="deep-session__subtitle">{session.subtitle}</p>
            <p className="lesson-hero__summary">{session.summary}</p>
          </div>
          <dl className="lesson-facts">
            <div><dt>난이도</dt><dd>{session.level}</dd></div>
            <div><dt>예상 시간</dt><dd>{session.estimatedMinutes}분</dd></div>
            <div><dt>본문 장</dt><dd>{session.chapters.length}개</dd></div>
            <div><dt>코드 실습</dt><dd>{session.chapters.reduce((sum, chapter) => sum + chapter.codeExamples.length, 0)}개</dd></div>
          </dl>
        </div>
      </header>

      <div className="lesson-layout deep-session__layout">
        <nav className="lesson-toc" aria-label="이 세션의 목차">
          <h2>이 세션의 지도</h2>
          <ol>
            <li><a href="#objectives"><span>00</span>목표와 핵심 질문</a></li>
            {session.chapters.map((chapter, index) => (
              <li key={chapter.id}>
                <a href={`#${chapter.id}`}><span>{String(index + 1).padStart(2, "0")}</span>{chapter.title}</a>
              </li>
            ))}
            <li><a href="#integrated-lab"><span>LAB</span>통합 실습</a></li>
            <li><a href="#practice"><span>TRY</span>단계별 과제</a></li>
            <li><a href="#review"><span>END</span>복습과 다음 단계</a></li>
          </ol>
        </nav>

        <article className="lesson-body deep-session__body">
          <section className="deep-question" id="objectives">
            <span>CORE QUESTION</span>
            <h2>{session.coreQuestion}</h2>
            <h3>이 세션을 마치면</h3>
            <ul>{session.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul>
          </section>

          {session.chapters.map((chapter, index) => (
            <section className="lesson-section deep-chapter" id={chapter.id} key={chapter.id}>
              <span className="lesson-section__number">CHAPTER {String(index + 1).padStart(2, "0")}</span>
              <h2>{chapter.title}</h2>
              <p className="chapter-lead">{chapter.lead}</p>
              {chapter.explanations.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}

              {chapter.concepts.length ? (
                <div className="concept-stack">
                  {chapter.concepts.map((concept) => (
                    <article key={concept.term}>
                      <header><span>KEY CONCEPT</span><h3>{concept.term}</h3></header>
                      <p><strong>{concept.definition}</strong></p>
                      {concept.detail.map((detail) => <p key={detail}>{detail}</p>)}
                      {concept.analogy ? <p className="concept-analogy"><b>비유로 이해하기</b>{concept.analogy}</p> : null}
                      {concept.caveat ? <p className="concept-caveat"><b>오해 주의</b>{concept.caveat}</p> : null}
                    </article>
                  ))}
                </div>
              ) : null}

              {chapter.codeExamples.map((example) => <DetailedCodeExample example={example} key={example.id} />)}

              {chapter.comparisons?.map((comparison) => (
                <div className="comparison-block" key={comparison.title}>
                  <h3>{comparison.title}</h3>
                  <div className="comparison-grid">
                    {comparison.options.map((option) => (
                      <article key={option.name}>
                        <h4>{option.name}</h4>
                        <p><strong>선택할 때</strong>{option.chooseWhen}</p>
                        <p><strong>피할 때</strong>{option.avoidWhen}</p>
                        <ul>{option.tradeoffs.map((tradeoff) => <li key={tradeoff}>{tradeoff}</li>)}</ul>
                      </article>
                    ))}
                  </div>
                </div>
              ))}

              {chapter.diagnostics.length ? (
                <div className="diagnostic-stack">
                  <h3>문제가 생겼을 때 진단 순서</h3>
                  {chapter.diagnostics.map((diagnostic, diagnosticIndex) => (
                    <details key={`${diagnostic.symptom}-${diagnosticIndex}`}>
                      <summary>{diagnostic.symptom}</summary>
                      <p><strong>가능성이 큰 원인</strong>{diagnostic.likelyCause}</p>
                      <div><strong>확인 순서</strong><ol>{diagnostic.checks.map((check) => <li key={check}>{check}</li>)}</ol></div>
                      <p><strong>해결</strong>{diagnostic.fix}</p>
                      <p><strong>다음부터 예방</strong>{diagnostic.prevention}</p>
                    </details>
                  ))}
                </div>
              ) : null}

              {chapter.expertNotes?.length ? (
                <aside className="expert-notes"><strong>전문가의 시선</strong><ul>{chapter.expertNotes.map((note) => <li key={note}>{note}</li>)}</ul></aside>
              ) : null}
            </section>
          ))}

          <section className="integrated-lab" id="integrated-lab">
            <p className="kicker">INTEGRATED LAB</p>
            <h2>{session.lab.title}</h2>
            <p>{session.lab.scenario}</p>
            <div className="lab-grid">
              <div><h3>준비</h3><ol>{session.lab.setup.map((item) => <li key={item}>{item}</li>)}</ol></div>
              <div><h3>진행</h3><ol>{session.lab.steps.map((item) => <li key={item}>{item}</li>)}</ol></div>
              <div><h3>완료 기준</h3><ul>{session.lab.expectedResult.map((item) => <li key={item}>{item}</li>)}</ul></div>
              <div><h3>더 해보기</h3><ul>{session.lab.extensions.map((item) => <li key={item}>{item}</li>)}</ul></div>
            </div>
          </section>

          <section className="practice-levels" id="practice">
            <p className="kicker">PRACTICE</p>
            <h2>세 단계로 내 것으로 만들기</h2>
            {session.exercises.map((exercise) => (
              <article key={exercise.difficulty}>
                <span>{exercise.difficulty}</span>
                <h3>{exercise.prompt}</h3>
                <h4>요구사항</h4><ul>{exercise.requirements.map((item) => <li key={item}>{item}</li>)}</ul>
                <details><summary>막혔을 때 힌트</summary><ul>{exercise.hints.map((item) => <li key={item}>{item}</li>)}</ul></details>
                <p><strong>완료 모습</strong>{exercise.expectedOutcome}</p>
                {exercise.solutionOutline?.length ? <details><summary>풀이 방향 확인</summary><ol>{exercise.solutionOutline.map((item) => <li key={item}>{item}</li>)}</ol></details> : null}
              </article>
            ))}
          </section>

          <section className="session-review" id="review">
            <p className="kicker">REVIEW</p>
            <h2>답을 말로 설명해 보세요</h2>
            {session.reviewQuestions.map((item, index) => (
              <details key={item.question}>
                <summary>{index + 1}. {item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
            <h3>완료 체크</h3>
            <ul className="checkpoint-list">{session.completionChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
            <CompletionButton slug={`curriculum-${session.slug}`} />
          </section>
        </article>

        <aside className="lesson-aside deep-session__aside">
          <div className="aside-block">
            <h2>먼저 알면 좋아요</h2>
            {session.prerequisites.length ? <ul>{session.prerequisites.map((prerequisite) => {
              const target = prerequisite.sessionSlug ? linkedSession(prerequisite.sessionSlug) : undefined;
              return <li key={prerequisite.title}>{target ? <Link href={`/curriculum/${target.courseId}/${target.slug}/`}>{prerequisite.title}</Link> : <strong>{prerequisite.title}</strong>}<small>{prerequisite.reason}</small></li>;
            })}</ul> : <p>선수 지식 없이 시작할 수 있습니다.</p>}
          </div>
          <div className="aside-block">
            <h2>다음에 이어서</h2>
            {session.nextSessions.length ? <ul>{session.nextSessions.map((nextSlug) => {
              const target = linkedSession(nextSlug);
              return <li key={nextSlug}>{target ? <Link href={`/curriculum/${target.courseId}/${target.slug}/`}>{target.title} →</Link> : <span>{nextSlug}</span>}</li>;
            })}</ul> : <p>이 모듈의 마지막 세션입니다.</p>}
          </div>
          <div className="aside-block source-evidence">
            <h2>원본 근거</h2>
            <p>{session.sourceCoverage.filesRead}개 파일을 읽고 {session.sourceCoverage.filesUsed}개를 직접 반영했습니다.</p>
            <ul>{session.sources.map((source) => <li key={source.id}>{source.publicUrl ? <a href={source.publicUrl} target="_blank" rel="noreferrer">{source.repository} ↗</a> : <strong>{source.repository}</strong>}<small>{source.path}</small><span>{source.evidence}</span></li>)}</ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
