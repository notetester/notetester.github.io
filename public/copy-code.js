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

  function selectCode(element) {
    const selection = window.getSelection();
    if (!selection) return false;
    const range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  }

  document.addEventListener("click", (event) => {
    const button = event
      .composedPath()
      .find((node) => typeof node?.matches === "function" && node.matches("[data-copy-code]"));
    if (!button) return;

    const codeElement = button.closest(".code-panel")?.querySelector("code");
    const code = codeElement?.textContent;
    if (!codeElement || !code) return;

    if (button.dataset.copyInProgress === "true") return;
    button.dataset.copyInProgress = "true";
    button.textContent = "복사 중…";
    copyText(code).then((copied) => {
      const selected = !copied && selectCode(codeElement);
      button.textContent = copied
        ? "복사됨"
        : selected
          ? "코드 선택됨 · Ctrl+C"
          : "복사 실패";
      window.setTimeout(() => {
        button.textContent = "코드 복사";
        delete button.dataset.copyInProgress;
      }, 1600);
    });
  }, true);
})();
