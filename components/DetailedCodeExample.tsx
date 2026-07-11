import type { DetailedCodeExample as DetailedCodeExampleData } from "@/content/curriculum/types";

export function DetailedCodeExample({ example }: { example: DetailedCodeExampleData }) {
  return (
    <section className="deep-code" id={example.id}>
      <header className="deep-code__header">
        <div>
          <span>CODE LAB · {example.language}</span>
          <h4>{example.title}</h4>
          <p>{example.purpose}</p>
        </div>
        {example.filename ? <code>{example.filename}</code> : null}
      </header>

      <div className="code-panel">
        <div className="code-panel__header">
          <span>{example.filename ?? example.title}</span>
          <span className="code-language">{example.language}</span>
          <button aria-label="코드 복사" aria-live="polite" className="copy-button" data-copy-code type="button">코드 복사</button>
        </div>
        <pre><code>{example.code}</code></pre>
      </div>

      <div className="deep-code__walkthrough">
        <h5>코드를 줄 단위로 읽기</h5>
        <dl>
          {example.walkthrough.map((item) => (
            <div key={`${item.lines}-${item.explanation}`}>
              <dt>{item.lines}</dt>
              <dd>{item.explanation}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="deep-code__execution">
        <div>
          <h5>실행 환경과 명령</h5>
          <ul>{example.run.environment.map((item) => <li key={item}>{item}</li>)}</ul>
          <pre><code>{example.run.command}</code></pre>
          {example.run.input ? <><strong>입력</strong><pre><code>{example.run.input}</code></pre></> : null}
        </div>
        <div className="result-panel">
          <strong>▶ 실제로 확인할 결과</strong>
          <pre>{example.output.value}</pre>
          <ul>{example.output.explanation.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </div>

      {example.experiments.length ? (
        <div className="experiment-list">
          <h5>값을 바꾸며 예측하기</h5>
          {example.experiments.map((experiment, index) => (
            <article key={`${experiment.change}-${index}`}>
              <span>EXPERIMENT {String(index + 1).padStart(2, "0")}</span>
              <p><strong>바꿀 것</strong>{experiment.change}</p>
              <p><strong>먼저 예측</strong>{experiment.prediction}</p>
              <p><strong>확인 결과</strong>{experiment.result}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
