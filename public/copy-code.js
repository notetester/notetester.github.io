/* global document, navigator, window, Element, HTMLButtonElement */

(() => {
  function copyWithTextarea(text) {
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
        // The textarea path also works when clipboard permission is unavailable.
      }
    }
    return copyWithTextarea(text);
  }

  document.addEventListener("click", async (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest("[data-copy-code]");
    if (!(button instanceof HTMLButtonElement)) return;

    const code = button.closest(".code-panel")?.querySelector("code")?.textContent;
    if (!code) return;

    button.disabled = true;
    const copied = await copyText(code);
    button.textContent = copied ? "복사됨" : "복사 실패";
    window.setTimeout(() => {
      button.textContent = "코드 복사";
      button.disabled = false;
    }, 1600);
  });
})();
