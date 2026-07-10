/* global document, navigator, window */

(() => {
  function copyWithTimeout(text) {
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(
        () => reject(new Error("clipboard timeout")),
        800,
      );
      navigator.clipboard.writeText(text).then(
        () => {
          window.clearTimeout(timer);
          resolve(true);
        },
        (error) => {
          window.clearTimeout(timer);
          reject(error);
        },
      );
    });
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await copyWithTimeout(text);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  document.addEventListener("click", (event) => {
    const button = event
      .composedPath()
      .find((node) => typeof node?.matches === "function" && node.matches("[data-copy-code]"));
    if (!button) return;

    const code = button.closest(".code-panel")?.querySelector("code")?.textContent;
    if (!code) return;

    if (button.dataset.copyInProgress === "true") return;
    button.dataset.copyInProgress = "true";
    button.textContent = "복사 중…";
    copyText(code).then((copied) => {
      button.textContent = copied ? "복사됨" : "복사 실패";
      window.setTimeout(() => {
        button.textContent = "코드 복사";
        delete button.dataset.copyInProgress;
      }, 1600);
    });
  }, true);
})();
