"use client";

import { useEffect, useState } from "react";

const storageKey = "notetester-learning-completed";

function readCompleted(): string[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function CompletionButton({ slug }: { slug: string }) {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCompleted(readCompleted().includes(slug));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [slug]);

  function toggle() {
    const saved = new Set<string>(readCompleted());
    if (saved.has(slug)) saved.delete(slug);
    else saved.add(slug);
    localStorage.setItem(storageKey, JSON.stringify([...saved]));
    setCompleted(saved.has(slug));
  }

  return (
    <button
      aria-pressed={completed}
      className={`completion-button ${completed ? "is-complete" : ""}`}
      onClick={toggle}
      type="button"
    >
      {completed ? "✓ 복습 완료" : "복습 완료로 표시"}
      <small>이 기기에만 저장됩니다</small>
    </button>
  );
}
