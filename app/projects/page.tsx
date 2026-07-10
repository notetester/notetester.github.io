import Link from "next/link";
import { projectHighlights } from "@/content/projectHighlights";

export const metadata = {
  title: "프로젝트에서 다시 배우기",
  description: "CareerTuner, LCB, TripTogether에서 꺼낸 재사용 가능한 개발 개념입니다.",
};

export default function ProjectsPage() {
  return (
    <main className="page-shell" id="main-content">
      <header className="page-hero">
        <div className="page-hero__inner">
          <p className="kicker">PROJECT LAB</p>
          <h1>완성한 프로젝트를<br />다시 교재로</h1>
          <p>기능 목록을 나열하는 대신, 실제 제품을 만들며 만난 설계 문제와 선택을 학습 가능한 개념으로 꺼냈습니다.</p>
        </div>
      </header>
      <div className="inner-page-content project-grid-full">
        {projectHighlights.map((project, index) => (
          <article className="project-card-full" key={project.slug}>
            <span>PROJECT {String(index + 1).padStart(2, "0")}</span>
            <h2>{project.name}</h2>
            <strong>{project.role}</strong>
            <p>{project.description}</p>
            <div className="concept-tags">
              {project.concepts.map((concept) => <span key={concept}>{concept}</span>)}
            </div>
            <div className="project-links">
              <Link href={`/learn/${project.lesson}/`}>개념 수업 →</Link>
              <a href={project.repository} rel="noreferrer" target="_blank">GitHub ↗</a>
              {project.portfolio ? <a href={project.portfolio} rel="noreferrer" target="_blank">포트폴리오 ↗</a> : null}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
