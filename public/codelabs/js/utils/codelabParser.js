// @ts-check
(function () {
  const ns = (window.MauCodelabs = window.MauCodelabs || {});

  /**
   * Escapes unsafe HTML characters to prevent XSS and preserve literal angle brackets.
   * @param {string} raw
   * @returns {string}
   */
  function escapeHtml(raw) {
    return String(raw)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Generates a URL-friendly slug for headings.
   * @param {string} text
   * @returns {string}
   */
  function slugify(text) {
    return String(text)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Parses a CLaaT Duration string (e.g. "0:05:00", "01:12:30", "10:00", "8") into seconds.
   * @param {string} durationStr
   * @returns {number}
   */
  function parseDurationToSeconds(durationStr) {
    const cleaned = String(durationStr || '').trim();
    if (!cleaned) return 0;

    const parts = cleaned.split(':').map((part) => Number(part));
    if (parts.some((n) => Number.isNaN(n) || n < 0)) {
      return 0;
    }

    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    if (parts.length === 1) {
      return parts[0] * 60;
    }
    return 0;
  }

  /**
   * Formats minutes into a human-friendly Spanish label (e.g. "77 min" or "12 min").
   * @param {number} minutes
   * @returns {string}
   */
  function formatMinutesLabel(minutes) {
    const safeMin = Math.max(1, Math.round(minutes));
    return `${safeMin} min`;
  }

  /**
   * Applies bold (**text**) and italic (*text*) formatting on already-escaped text.
   * @param {string} escapedText
   * @returns {string}
   */
  function applyEmphasis(escapedText) {
    let result = escapedText.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
    return result;
  }

  /**
   * Renders inline Markdown safely (inline code, links, bold, italic, arrows).
   * @param {string} rawText
   * @returns {string}
   */
  function renderInlineMarkdown(rawText) {
    if (!rawText) return '';

    /** @type {string[]} */
    const codeTokens = [];
    /** @type {string[]} */
    const linkTokens = [];

    const storeCode = (/** @type {string} */ codeContent) => {
      const idx = codeTokens.length;
      codeTokens.push(`<code class="cl-inline-code">${escapeHtml(codeContent)}</code>`);
      return `\u0000CODE_${idx}\u0000`;
    };

    // 1. Handle escaped backtick inside inline code (e.g. `Ctrl+\`` -> Ctrl+`)
    let text = String(rawText).replace(/`([^`]*?)\\``/g, (_, content) => storeCode(`${content}\``));

    // 2. Handle double-backtick inline code (``code with ` inside``)
    text = text.replace(/``(.+?)``/g, (_, content) => storeCode(content.trim()));

    // 3. Handle standard single-backtick inline code
    text = text.replace(/`([^`]+)`/g, (_, content) => storeCode(content));

    // 4. Escape HTML on all non-code prose
    text = escapeHtml(text);

    // 5. Extract Markdown links [label](url) safely
    text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, rawHref) => {
      const href = rawHref.replace(/&amp;/g, '&');
      const isSafeProtocol = /^(https?:\/\/|mailto:|\/|#|\.\/|\.\.\/)/i.test(href);
      if (!isSafeProtocol) {
        return label;
      }
      const isExternal = /^https?:\/\//i.test(href);
      const formattedLabel = applyEmphasis(label);
      const attrs = isExternal
        ? ' target="_blank" rel="noopener noreferrer" class="cl-link cl-link--external"'
        : ' class="cl-link"';
      const externalIcon = isExternal
        ? '<span class="cl-link-arrow" aria-hidden="true">↗</span>'
        : '';
      const idx = linkTokens.length;
      linkTokens.push(`<a href="${escapeHtml(href)}"${attrs}>${formattedLabel}${externalIcon}</a>`);
      return `\u0000LINK_${idx}\u0000`;
    });

    // 6. Apply bold, italic, and prose arrows
    text = applyEmphasis(text);
    text = text.replace(/\s-&gt;\s/g, ' <span class="cl-prose-arrow" aria-hidden="true">→</span> ');

    // 7. Restore links and inline code tokens
    text = text.replace(/\u0000LINK_(\d+)\u0000/g, (_, idx) => linkTokens[Number(idx)] || '');
    text = text.replace(/\u0000CODE_(\d+)\u0000/g, (_, idx) => codeTokens[Number(idx)] || '');

    return text;
  }

  /**
   * Detects whether a fenced code block represents an ASCII diagram or file tree.
   * @param {string} language
   * @param {string} code
   * @returns {{ isDiagram: boolean, diagramKind: 'architecture' | 'tree' | null }}
   */
  function classifyCodeBlock(language, code) {
    const lang = language.toLowerCase();
    if (lang && lang !== 'text' && lang !== 'plaintext' && lang !== 'ascii') {
      return { isDiagram: false, diagramKind: null };
    }

    if (/[├└│─]{2,}|(?:├──|└──)/.test(code)) {
      return { isDiagram: true, diagramKind: 'tree' };
    }

    if (/\+-{3,}\+/.test(code) && /\|/.test(code)) {
      return { isDiagram: true, diagramKind: 'architecture' };
    }

    return { isDiagram: false, diagramKind: null };
  }

  /**
   * @param {string} row
   * @returns {string}
   */
  function stripOuterPipes(row) {
    return row.trim().replace(/^\|/, '').replace(/\|$/, '');
  }

  /**
   * @param {string} line
   * @returns {boolean}
   */
  function isTableSeparator(line) {
    const trimmed = line.trim();
    if (!trimmed.includes('|')) return false;
    const cells = stripOuterPipes(trimmed).split('|').map((c) => c.trim());
    return cells.length >= 2 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
  }

  /**
   * @param {string} row
   * @returns {string[]}
   */
  function parseTableRow(row) {
    return stripOuterPipes(row)
      .split(/(?<!\\)\|/)
      .map((cell) => cell.trim().replace(/\\\|/g, '|'));
  }

  /**
   * Parses a block of list lines (supporting nested 2+ space indented sublists).
   * @param {string[]} lines
   */
  function parseListLines(lines) {
    const itemRegex = /^(\s*)(\*|-|\+|(\d+)\.)\s+(.*)$/;
    const firstMatch = lines[0].match(itemRegex);
    const rootIndent = firstMatch ? firstMatch[1].length : 0;
    const rootOrdered = Boolean(firstMatch && firstMatch[3]);
    const rootStart = firstMatch && firstMatch[3] ? parseInt(firstMatch[3], 10) : 1;

    const rootList = {
      type: /** @type {'list'} */ ('list'),
      ordered: rootOrdered,
      start: rootStart,
      items: /** @type {Array<{ text: string, children: any[] }>} */ ([]),
    };

    const stack = [{ indent: rootIndent, list: rootList }];

    for (const rawLine of lines) {
      const match = rawLine.match(itemRegex);
      if (match) {
        const indent = match[1].length;
        const isOrdered = Boolean(match[3]);
        const startNum = match[3] ? parseInt(match[3], 10) : 1;
        const itemText = match[4].trim();

        while (stack.length > 1 && indent < stack[stack.length - 1].indent) {
          stack.pop();
        }

        const top = stack[stack.length - 1];
        if (indent > top.indent && top.list.items.length > 0) {
          const parentItem = top.list.items[top.list.items.length - 1];
          const childList = {
            type: /** @type {'list'} */ ('list'),
            ordered: isOrdered,
            start: startNum,
            items: [{ text: itemText, children: /** @type {any[]} */ ([]) }],
          };
          parentItem.children.push(childList);
          stack.push({ indent, list: childList });
        } else {
          top.list.items.push({ text: itemText, children: [] });
        }
      } else if (rawLine.trim()) {
        const top = stack[stack.length - 1];
        if (top.list.items.length > 0) {
          const currentItem = top.list.items[top.list.items.length - 1];
          currentItem.text += ` ${rawLine.trim()}`;
        }
      }
    }

    return rootList;
  }

  /**
   * Tokenizes the Markdown body of a single CLaaT step into structured AST blocks.
   * @param {string[]} rawLines
   */
  function tokenizeStepBlocks(rawLines) {
    const lines = [...rawLines];
    while (lines.length > 0 && !lines[0].trim()) {
      lines.shift();
    }
    while (
      lines.length > 0 &&
      (!lines[lines.length - 1].trim() || /^-{3,}$/.test(lines[lines.length - 1].trim()))
    ) {
      lines.pop();
    }

    /** @type {any[]} */
    const blocks = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        i += 1;
        continue;
      }

      // 1. Fenced code block
      const fenceMatch = trimmed.match(/^(`{3,}|~{3,})([^\s`]*).*$/);
      if (fenceMatch) {
        const fenceChars = fenceMatch[1];
        const language = (fenceMatch[2] || 'text').trim();
        /** @type {string[]} */
        const codeLines = [];
        i += 1;
        while (i < lines.length && !lines[i].trim().startsWith(fenceChars)) {
          codeLines.push(lines[i]);
          i += 1;
        }
        if (i < lines.length) {
          i += 1;
        }
        const code = codeLines.join('\n');
        const { isDiagram, diagramKind } = classifyCodeBlock(language, code);
        blocks.push({
          type: 'code',
          language,
          code,
          isDiagram,
          diagramKind,
        });
        continue;
      }

      // 2. CLaaT Single-line Callout: `Positive : ...` or `Negative : ...`
      const singleCalloutMatch = trimmed.match(/^(Positive|Negative)\s*:\s*(.+)$/i);
      if (singleCalloutMatch) {
        const variant = singleCalloutMatch[1].toLowerCase();
        const contentParts = [singleCalloutMatch[2].trim()];
        i += 1;
        while (
          i < lines.length &&
          lines[i].trim() &&
          !/^(#{1,6}\s|`{3,}|-{3,}$|(?:Positive|Negative)\s*:)/i.test(lines[i].trim())
        ) {
          contentParts.push(lines[i].trim());
          i += 1;
        }
        blocks.push({
          type: 'callout',
          variant,
          content: contentParts.join(' '),
        });
        continue;
      }

      // 3. CLaaT Two-line Callout
      if (/^(Positive|Negative)$/i.test(trimmed) && i + 1 < lines.length && /^:\s+/.test(lines[i + 1].trim())) {
        const variant = trimmed.toLowerCase();
        const contentParts = [lines[i + 1].trim().replace(/^:\s+/, '')];
        i += 2;
        while (
          i < lines.length &&
          lines[i].trim() &&
          !/^(#{1,6}\s|`{3,}|-{3,}$)/i.test(lines[i].trim())
        ) {
          contentParts.push(lines[i].trim());
          i += 1;
        }
        blocks.push({
          type: 'callout',
          variant,
          content: contentParts.join(' '),
        });
        continue;
      }

      // 4. Subheadings (### or ####)
      const headingMatch = trimmed.match(/^(#{3,4})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length === 3 ? 3 : 4;
        const headingText = headingMatch[2].trim();
        blocks.push({
          type: 'heading',
          level,
          text: headingText,
          id: slugify(headingText),
        });
        i += 1;
        continue;
      }

      // 5. Horizontal rule
      if (/^-{3,}$/.test(trimmed)) {
        blocks.push({ type: 'hr' });
        i += 1;
        continue;
      }

      // 6. GFM Pipe Table
      if (trimmed.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
        const headers = parseTableRow(trimmed);
        const separatorCells = parseTableRow(lines[i + 1]);
        const alignments = separatorCells.map((cell) => {
          if (cell.startsWith(':') && cell.endsWith(':')) return 'center';
          if (cell.endsWith(':')) return 'right';
          return 'left';
        });
        i += 2;
        /** @type {string[][]} */
        const rows = [];
        while (i < lines.length && lines[i].trim() && lines[i].includes('|')) {
          rows.push(parseTableRow(lines[i]));
          i += 1;
        }
        blocks.push({
          type: 'table',
          headers,
          alignments,
          rows,
        });
        continue;
      }

      // 7. Ordered or Unordered Lists
      if (/^\s*(\*|-|\+|\d+\.)\s+/.test(line)) {
        /** @type {string[]} */
        const listLines = [];
        while (i < lines.length) {
          const cur = lines[i];
          const curTrim = cur.trim();
          if (!curTrim) {
            if (i + 1 < lines.length && /^\s{2,}(\*|-|\+|\d+\.)\s+/.test(lines[i + 1])) {
              i += 1;
              continue;
            }
            break;
          }
          if (/^\s*(\*|-|\+|\d+\.)\s+/.test(cur) || /^\s{2,}\S/.test(cur)) {
            if (/^`{3,}/.test(curTrim)) {
              break;
            }
            listLines.push(cur);
            i += 1;
          } else {
            break;
          }
        }
        blocks.push(parseListLines(listLines));
        continue;
      }

      // 8. Standard Paragraph
      /** @type {string[]} */
      const paragraphLines = [];
      while (
        i < lines.length &&
        lines[i].trim() &&
        !/^(#{1,6}\s|`{3,}|~{3,}|-{3,}$|(?:Positive|Negative)\s*:)/i.test(lines[i].trim()) &&
        !/^\s*(\*|-|\+|\d+\.)\s+/.test(lines[i]) &&
        !(lines[i].includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1]))
      ) {
        paragraphLines.push(lines[i].trim());
        i += 1;
      }
      if (paragraphLines.length > 0) {
        blocks.push({
          type: 'paragraph',
          text: paragraphLines.join(' '),
        });
      } else {
        i += 1;
      }
    }

    return blocks;
  }

  /**
   * Parses a complete CLaaT-formatted Markdown string into metadata and interactive steps.
   * @param {string} markdownSource
   * @param {{ fallbackId?: string, featured?: boolean }} [options]
   */
  function parseCodelabMarkdown(markdownSource, options = {}) {
    const normalized = String(markdownSource || '').replace(/\r\n/g, '\n');
    const allLines = normalized.split('\n');

    /** @type {Record<string, string>} */
    const rawMeta = {};
    let lineCursor = 0;

    if (allLines[0] && allLines[0].trim() === '---') {
      lineCursor = 1;
      while (lineCursor < allLines.length && allLines[lineCursor].trim() !== '---') {
        const metaMatch = allLines[lineCursor].match(/^([A-Za-z0-9 _-]+)\s*:\s*(.*)$/);
        if (metaMatch) {
          rawMeta[metaMatch[1].trim().toLowerCase()] = metaMatch[2].trim();
        }
        lineCursor += 1;
      }
      if (lineCursor < allLines.length && allLines[lineCursor].trim() === '---') {
        lineCursor += 1;
      }
    } else {
      while (lineCursor < allLines.length) {
        const line = allLines[lineCursor].trim();
        if (!line) {
          lineCursor += 1;
          break;
        }
        if (line.startsWith('#')) {
          break;
        }
        const metaMatch = line.match(/^([A-Za-z0-9 _-]+)\s*:\s*(.*)$/);
        if (metaMatch) {
          rawMeta[metaMatch[1].trim().toLowerCase()] = metaMatch[2].trim();
          lineCursor += 1;
        } else {
          break;
        }
      }
    }

    let title = '';
    /** @type {string[]} */
    const introLines = [];
    let inIntroFence = false;

    while (lineCursor < allLines.length) {
      const line = allLines[lineCursor];
      const trimmed = line.trim();

      if (/^(`{3,}|~{3,})/.test(trimmed)) {
        inIntroFence = !inIntroFence;
      }

      if (!inIntroFence && /^##\s+/.test(trimmed)) {
        break;
      }

      if (!inIntroFence && !title && /^#\s+/.test(trimmed)) {
        title = trimmed.replace(/^#\s+/, '').trim();
      } else if (trimmed) {
        introLines.push(trimmed);
      }

      lineCursor += 1;
    }

    /** @type {Array<{ heading: string, lines: string[] }>} */
    const rawSteps = [];
    let activeFence = '';

    for (let idx = lineCursor; idx < allLines.length; idx += 1) {
      const line = allLines[idx];
      const trimmed = line.trim();

      const fenceCheck = trimmed.match(/^(`{3,}|~{3,})/);
      if (fenceCheck) {
        if (!activeFence) {
          activeFence = fenceCheck[1];
        } else if (trimmed.startsWith(activeFence)) {
          activeFence = '';
        }
      }

      if (!activeFence && /^##\s+/.test(trimmed)) {
        rawSteps.push({
          heading: trimmed.replace(/^##\s+/, '').trim(),
          lines: [],
        });
      } else if (rawSteps.length > 0) {
        rawSteps[rawSteps.length - 1].lines.push(line);
      }
    }

    const steps = rawSteps.map((rawStep, index) => {
      const numberMatch = rawStep.heading.match(/^(\d+)\.\s*(.+)$/);
      const stepNumber = numberMatch ? parseInt(numberMatch[1], 10) : index + 1;
      const cleanTitle = numberMatch ? numberMatch[2].trim() : rawStep.heading;

      const bodyLines = [...rawStep.lines];
      let durationSeconds = 300;

      for (let k = 0; k < Math.min(4, bodyLines.length); k += 1) {
        const durMatch = bodyLines[k].trim().match(/^Duration\s*:\s*([0-9:]+)$/i);
        if (durMatch) {
          durationSeconds = parseDurationToSeconds(durMatch[1]);
          bodyLines.splice(k, 1);
          break;
        }
      }

      const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

      return {
        index,
        stepNumber,
        rawTitle: rawStep.heading,
        title: cleanTitle,
        durationSeconds,
        durationMinutes,
        remainingSeconds: 0,
        remainingMinutes: 0,
        blocks: tokenizeStepBlocks(bodyLines),
      };
    });

    let runningSeconds = 0;
    for (let s = steps.length - 1; s >= 0; s -= 1) {
      runningSeconds += steps[s].durationSeconds;
      steps[s].remainingSeconds = runningSeconds;
      steps[s].remainingMinutes = Math.max(1, Math.round(runningSeconds / 60));
    }

    const totalDurationSeconds = runningSeconds;
    const totalDurationMinutes = Math.max(1, Math.round(totalDurationSeconds / 60));

    const splitCsv = (/** @type {string | undefined} */ val) =>
      val
        ? val
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

    const id = rawMeta.id || options.fallbackId || slugify(title || 'codelab');
    const byline = introLines.join(' ').replace(/^\*+|\*+$/g, '').trim();

    const metadata = {
      id,
      title: title || id,
      byline,
      summary: rawMeta.summary || '',
      categories: splitCsv(rawMeta.categories),
      tags: splitCsv(rawMeta.tags),
      status: rawMeta.status || 'Published',
      authors: rawMeta.authors || 'Maureen Barahona',
      feedbackLink:
        rawMeta['feedback link'] ||
        rawMeta.feedback_link ||
        rawMeta.feedbacklink ||
        'https://github.com/maureenbarahona',
      totalDurationSeconds,
      totalDurationMinutes,
      featured: Boolean(options.featured),
    };

    return { metadata, steps };
  }

  ns.parser = {
    escapeHtml,
    slugify,
    parseDurationToSeconds,
    formatMinutesLabel,
    renderInlineMarkdown,
    tokenizeStepBlocks,
    parseCodelabMarkdown,
  };
})();
