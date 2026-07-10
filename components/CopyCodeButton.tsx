"use client";

import { useState } from "react";

function copyWithTextarea(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

export function CopyCodeButton({ code }: { code: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      if (!navigator.clipboard || !window.isSecureContext) {
        if (!copyWithTextarea(code)) throw new Error("copy command failed");
      } else {
        await Promise.race([
          navigator.clipboard.writeText(code),
          new Promise<never>((_, reject) => {
            window.setTimeout(() => reject(new Error("clipboard timeout")), 800);
          }),
        ]);
      }
      setStatus("copied");
    } catch {
      setStatus(copyWithTextarea(code) ? "copied" : "failed");
    }
    window.setTimeout(() => setStatus("idle"), 1600);
  }

  return (
    <button aria-live="polite" className="copy-button" onClick={copy} type="button">
      {status === "copied" ? "복사됨" : status === "failed" ? "복사 실패" : "코드 복사"}
    </button>
  );
}
