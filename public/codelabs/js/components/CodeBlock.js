// @ts-check
(function () {
  const ns = (window.MauCodelabs = window.MauCodelabs || {});

  const COPY_ICON = `
<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
</svg>`;

  const CHECK_ICON = `
<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <polyline points="20 6 9 17 4 12"></polyline>
</svg>`;

  /** @type {Record<string, string>} */
  const LANGUAGE_LABELS = {
    bash: 'Terminal · Bash',
    sh: 'Terminal · Shell',
    shell: 'Terminal · Shell',
    ts: 'TypeScript',
    typescript: 'TypeScript',
    js: 'JavaScript',
    javascript: 'JavaScript',
    json: 'JSON',
    dockerfile: 'Dockerfile',
    nginx: 'Nginx Config',
    yaml: 'YAML',
    yml: 'YAML',
    html: 'HTML',
    css: 'CSS',
    text: 'Texto / Consola',
  };

  /**
   * Single-pass syntax highlighter that never mutates generated HTML tags.
   * @param {string} code
   * @param {string} language
   * @param {boolean} isDiagram
   * @returns {string}
   */
  function highlightSyntax(code, language, isDiagram) {
    const { escapeHtml } = ns.parser;
    const lang = (language || 'text').toLowerCase();

    if (isDiagram) {
      return escapeHtml(code).replace(
        /(\+[-+]+\+|[-=]{2,}&gt;|&lt;[-=]{2,}|[├└│─]+|\b(?:Google Stitch|Antigravity IDE|GitHub|Google Cloud Build|Artifact Registry|Google Cloud Run|Stitch MCP|Developer Plugin)\b)/g,
        (match) => {
          if (/^[A-Z]/.test(match)) {
            return `<span class="tok-entity">${match}</span>`;
          }
          return `<span class="tok-diagram-line">${match}</span>`;
        }
      );
    }

    if (lang === 'text' || lang === 'plaintext') {
      return escapeHtml(code);
    }

    /** @type {RegExp} */
    let tokenRegex;

    if (lang === 'json') {
      tokenRegex =
        /(?<key>"(?:\\.|[^"\\])*"(?=\s*:))|(?<string>"(?:\\.|[^"\\])*")|(?<keyword>\b(?:true|false|null)\b)|(?<number>-?\b\d+(?:\.\d+)?\b)/g;
    } else if (lang === 'bash' || lang === 'sh' || lang === 'shell') {
      tokenRegex =
        /(?<comment>(?:^|\s)#[^\n]*)|(?<string>"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(?<variable>\$\{?[A-Za-z_][A-Za-z0-9_]*\}?)|(?<flag>(?:^|\s)--?[A-Za-z0-9_-]+)|(?<keyword>\b(?:gcloud|git|gh|npm|npx|agy|curl|echo|export|mkdir|cd|cat|EOF)\b)/gm;
    } else if (lang === 'dockerfile') {
      tokenRegex =
        /(?<comment>^\s*#[^\n]*)|(?<keyword>^\s*(?:FROM|AS|WORKDIR|COPY|RUN|EXPOSE|CMD|ENTRYPOINT|ENV|ARG)\b)|(?<flag>\s--[A-Za-z0-9_-]+(?:=[^\s]+)?)|(?<string>"(?:\\.|[^"\\])*")/gim;
    } else if (lang === 'nginx') {
      tokenRegex =
        /(?<comment>#[^\n]*)|(?<string>"(?:\\.|[^"\\])*")|(?<keyword>\b(?:server|listen|server_name|root|index|gzip|gzip_types|location|try_files|expires|add_header)\b)|(?<variable>\$[A-Za-z_][A-Za-z0-9_]*)|(?<number>\b\d+[A-Za-z]*\b)/g;
    } else {
      tokenRegex =
        /(?<comment>\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(?<string>`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(?<keyword>\b(?:export|import|from|type|interface|function|return|const|let|var|if|else|for|while|new|async|await|true|false|null|undefined)\b)|(?<type>\b(?:string|number|boolean|void|Promise|Array|Record|Math|Object)\b)|(?<number>\b\d+(?:\.\d+)?\b)/g;
    }

    let out = '';
    let lastIndex = 0;

    for (const match of code.matchAll(tokenRegex)) {
      const matchIndex = match.index ?? 0;
      if (matchIndex > lastIndex) {
        out += escapeHtml(code.slice(lastIndex, matchIndex));
      }

      const rawToken = match[0];
      const groups = match.groups || {};
      let cls = 'tok-plain';

      if (groups.comment !== undefined) cls = 'tok-comment';
      else if (groups.key !== undefined) cls = 'tok-key';
      else if (groups.string !== undefined) cls = 'tok-string';
      else if (groups.variable !== undefined) cls = 'tok-var';
      else if (groups.flag !== undefined) cls = 'tok-flag';
      else if (groups.keyword !== undefined) cls = 'tok-keyword';
      else if (groups.type !== undefined) cls = 'tok-type';
      else if (groups.number !== undefined) cls = 'tok-number';

      const leadingSpaceMatch = rawToken.match(/^(\s+)([\s\S]*)$/);
      if (leadingSpaceMatch && (cls === 'tok-flag' || cls === 'tok-comment')) {
        out +=
          escapeHtml(leadingSpaceMatch[1]) +
          `<span class="${cls}">${escapeHtml(leadingSpaceMatch[2])}</span>`;
      } else {
        out += `<span class="${cls}">${escapeHtml(rawToken)}</span>`;
      }

      lastIndex = matchIndex + rawToken.length;
    }

    if (lastIndex < code.length) {
      out += escapeHtml(code.slice(lastIndex));
    }

    return out;
  }

  /**
   * @param {string} text
   * @returns {Promise<boolean>}
   */
  async function copyTextToClipboard(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fall through to textarea fallback (e.g. on file://)
      }
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }

  /**
   * @param {{ language: string, code: string, isDiagram: boolean, diagramKind?: 'architecture' | 'tree' | null }} block
   * @returns {HTMLElement}
   */
  function createCodeBlock(block) {
    const { escapeHtml } = ns.parser;
    const wrapper = document.createElement('div');
    const langKey = (block.language || 'text').toLowerCase();
    const isDiagram = block.isDiagram;

    wrapper.className = `cl-code-block${isDiagram ? ' cl-code-block--diagram' : ''}`;

    let headerLabel = LANGUAGE_LABELS[langKey] || block.language.toUpperCase();
    if (isDiagram) {
      headerLabel =
        block.diagramKind === 'tree' ? 'Estructura del Proyecto' : 'Diagrama de Arquitectura';
    }

    const header = document.createElement('div');
    header.className = 'cl-code-block__header';

    const langBadge = document.createElement('span');
    langBadge.className = 'cl-code-block__lang';
    langBadge.textContent = headerLabel;

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'cl-copy-btn';
    copyBtn.setAttribute('aria-label', 'Copiar código al portapapeles');
    copyBtn.innerHTML = `${COPY_ICON}<span class="cl-copy-btn__label">Copiar código</span>`;

    /** @type {number | null} */
    let resetTimer = null;

    copyBtn.addEventListener('click', async () => {
      const copied = await copyTextToClipboard(block.code);
      if (!copied) return;

      copyBtn.classList.add('is-copied');
      copyBtn.innerHTML = `${CHECK_ICON}<span class="cl-copy-btn__label">¡Copiado!</span>`;

      if (resetTimer !== null) {
        window.clearTimeout(resetTimer);
      }
      resetTimer = window.setTimeout(() => {
        copyBtn.classList.remove('is-copied');
        copyBtn.innerHTML = `${COPY_ICON}<span class="cl-copy-btn__label">Copiar código</span>`;
        resetTimer = null;
      }, 2000);
    });

    header.appendChild(langBadge);
    header.appendChild(copyBtn);

    const pre = document.createElement('pre');
    pre.className = 'cl-code-block__pre';
    const codeEl = document.createElement('code');
    codeEl.className = `cl-code-block__code language-${escapeHtml(langKey)}`;
    codeEl.innerHTML = highlightSyntax(block.code, langKey, isDiagram);
    pre.appendChild(codeEl);

    wrapper.appendChild(header);
    wrapper.appendChild(pre);

    return wrapper;
  }

  ns.CodeBlock = { highlightSyntax, createCodeBlock, copyTextToClipboard };
})();
