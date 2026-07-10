import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <strong>기억은 흐려져도, 다시 찾는 길은 선명하게.</strong>
        <p>직접 공부하고 만든 코드에서 출발한 공개 개발 학습자료입니다.</p>
      </div>
      <div className="site-footer__links">
        <Link href="/roadmap/">전체 학습 순서</Link>
        <Link href="/glossary/">용어 찾아보기</Link>
        <a href="https://github.com/notetester" rel="noreferrer" target="_blank">
          GitHub
        </a>
      </div>
    </footer>
  );
}
