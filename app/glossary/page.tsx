import Link from "next/link";
import { glossaryTerms } from "@/content/glossary";

export const metadata = {
  title: "개발 용어 사전",
  description: "수업 중 다시 만나는 핵심 개발 용어를 짧고 정확하게 풀이합니다.",
};

export default function GlossaryPage() {
  return (
    <main className="page-shell" id="main-content">
      <header className="page-hero">
        <div className="page-hero__inner">
          <p className="kicker">GLOSSARY</p>
          <h1>모르는 단어 때문에<br />흐름을 놓치지 않도록</h1>
          <p>약어와 기술 용어를 일상적인 말로 다시 풀었습니다. 정의만으로 부족한 용어는 실제로 쓰이는 수업으로 바로 연결됩니다.</p>
        </div>
      </header>
      <div className="inner-page-content glossary-grid">
        {glossaryTerms.map((item) => (
          <article className="glossary-card" id={item.term} key={item.term}>
            <h2>{item.term}{item.english ? <small>{item.english}</small> : null}</h2>
            <p>{item.definition}</p>
            {item.lesson ? <Link href={`/learn/${item.lesson}/`}>수업에서 확인 →</Link> : null}
          </article>
        ))}
      </div>
    </main>
  );
}
