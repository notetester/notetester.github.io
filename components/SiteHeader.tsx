import Link from "next/link";

const navigation = [
  { href: "/curriculum/", label: "정규 과정" },
  { href: "/roadmap/", label: "학습 지도" },
  { href: "/glossary/", label: "용어 사전" },
  { href: "/projects/", label: "프로젝트" },
  { href: "/sources/", label: "원본 자료" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand" href="/" aria-label="개발 학습 아카이브 홈">
          <span className="brand__mark">N</span>
          <span>
            <strong>NOTE TESTER</strong>
            <small>개발 학습 아카이브</small>
          </span>
        </Link>
        <nav className="main-nav" aria-label="주요 메뉴">
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
