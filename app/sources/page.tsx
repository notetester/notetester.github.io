import { allLessons } from "@/content/lessons";
import { sourceHref } from "@/content/sourceLinks";

export const metadata = {
  title: "원본 학습자료",
  description: "이 아카이브의 수업을 구성할 때 참고한 공개 코드 저장소와 경로입니다.",
};

export default function SourcesPage() {
  const references = Array.from(
    new Map(
      allLessons.flatMap((lesson) => lesson.sources).map((source) => [
        `${source.repository}#${source.path ?? ""}`,
        source,
      ]),
    ).values(),
  );

  return (
    <main className="page-shell" id="main-content">
      <header className="page-hero">
        <div className="page-hero__inner">
          <p className="kicker">SOURCE NOTES</p>
          <h1>설명의 뿌리가 된<br />공개 학습 코드</h1>
          <p>예제는 학습 흐름에 맞게 다듬었지만 출발점은 실제로 작성했던 코드입니다. 민감 정보와 비공개 백업은 공개 목록에 포함하지 않습니다.</p>
        </div>
      </header>
      <div className="inner-page-content source-grid">
        {references.map((source, index) => (
          <article className="source-card" key={`${source.repository}-${source.path ?? ""}`}>
            <span>SOURCE {String(index + 1).padStart(2, "0")}</span>
            <h2>{source.label}</h2>
            {source.path ? <p><code>{source.path}</code></p> : null}
            {source.note ? <p>{source.note}</p> : null}
            <a href={sourceHref(source)} rel="noreferrer" target="_blank">
              {source.path ? "원본 파일에서 보기 ↗" : "공개 저장소에서 보기 ↗"}
            </a>
          </article>
        ))}
      </div>
    </main>
  );
}
