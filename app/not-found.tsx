import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found" id="main-content">
      <div>
        <p className="kicker">404 · NOTE MISSING</p>
        <h1>길을 잠깐 잃었습니다.</h1>
        <p>주소가 바뀌었거나 아직 작성되지 않은 수업입니다.</p>
        <Link className="button button--primary" href="/">학습 아카이브로 돌아가기</Link>
      </div>
    </main>
  );
}
