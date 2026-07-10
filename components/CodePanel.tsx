import type { CodeExample } from "@/content/types";

export function CodePanel({ example }: { example: CodeExample }) {
  return (
    <div className="code-panel">
      <div className="code-panel__header">
        <span>{example.label}</span>
        <span className="code-language">{example.language}</span>
        <button aria-label="코드 복사" aria-live="polite" className="copy-button" data-copy-code type="button">
          코드 복사
        </button>
      </div>
      <pre>
        <code>{example.code}</code>
      </pre>
      {example.explanation?.length ? (
        <ul className="code-explanation">
          {example.explanation.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
