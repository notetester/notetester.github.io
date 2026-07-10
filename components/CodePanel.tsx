import type { CodeExample } from "@/content/types";
import { CopyCodeButton } from "./CopyCodeButton";

export function CodePanel({ example }: { example: CodeExample }) {
  return (
    <div className="code-panel">
      <div className="code-panel__header">
        <span>{example.label}</span>
        <span className="code-language">{example.language}</span>
        <CopyCodeButton code={example.code} />
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
