// @ts-check
(function () {
  const ns = (window.MauCodelabs = window.MauCodelabs || {});

  const POSITIVE_ICON = `
<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
  <path d="M9 21h6"/>
</svg>`;

  const NEGATIVE_ICON = `
<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  <line x1="12" y1="8" x2="12" y2="12"/>
  <line x1="12" y1="16" x2="12.01" y2="16"/>
</svg>`;

  /**
   * Creates a styled CLaaT Callout Box DOM element (`Positive` tip or `Negative` warning/security).
   * @param {{ variant: 'positive' | 'negative', content: string }} block
   * @returns {HTMLElement}
   */
  function createCalloutBox(block) {
    const isPositive = block.variant === 'positive';
    const aside = document.createElement('aside');
    aside.className = `cl-callout ${isPositive ? 'cl-callout--positive' : 'cl-callout--negative'}`;
    aside.setAttribute('role', 'note');

    const badgeLabel = isPositive ? 'Buena práctica' : 'Importante · Seguridad / Costos';

    aside.innerHTML = `
      <div class="cl-callout__icon-wrap">
        ${isPositive ? POSITIVE_ICON : NEGATIVE_ICON}
      </div>
      <div class="cl-callout__body">
        <span class="cl-callout__eyebrow">${badgeLabel}</span>
        <div class="cl-callout__text">${ns.parser.renderInlineMarkdown(block.content)}</div>
      </div>
    `;

    return aside;
  }

  ns.CalloutBox = { createCalloutBox };
})();
