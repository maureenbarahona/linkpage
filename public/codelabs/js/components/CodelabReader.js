// @ts-check
(function () {
  const ns = (window.MauCodelabs = window.MauCodelabs || {});

  /**
   * @param {any} listBlock
   * @returns {HTMLElement}
   */
  function renderListElement(listBlock) {
    const { renderInlineMarkdown } = ns.parser;
    const listEl = document.createElement(listBlock.ordered ? 'ol' : 'ul');
    listEl.className = `cl-list ${listBlock.ordered ? 'cl-list--ordered' : 'cl-list--unordered'}`;
    if (listBlock.ordered && listBlock.start > 1) {
      listEl.setAttribute('start', String(listBlock.start));
    }

    listBlock.items.forEach((/** @type {any} */ item) => {
      const li = document.createElement('li');
      li.className = 'cl-list__item';

      const span = document.createElement('div');
      span.className = 'cl-list__text';
      span.innerHTML = renderInlineMarkdown(item.text);
      li.appendChild(span);

      if (item.children && item.children.length > 0) {
        item.children.forEach((/** @type {any} */ childList) => {
          li.appendChild(renderListElement(childList));
        });
      }

      listEl.appendChild(li);
    });

    return listEl;
  }

  /**
   * @param {any} tableBlock
   * @returns {HTMLElement}
   */
  function renderTableElement(tableBlock) {
    const { renderInlineMarkdown } = ns.parser;
    const wrap = document.createElement('div');
    wrap.className = 'cl-table-wrap';

    const table = document.createElement('table');
    table.className = 'cl-table';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    tableBlock.headers.forEach((/** @type {string} */ headerText, /** @type {number} */ colIdx) => {
      const th = document.createElement('th');
      th.style.textAlign = tableBlock.alignments[colIdx] || 'left';
      th.innerHTML = renderInlineMarkdown(headerText);
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);

    const tbody = document.createElement('tbody');
    tableBlock.rows.forEach((/** @type {string[]} */ rowCells) => {
      const tr = document.createElement('tr');
      tableBlock.headers.forEach((/** @type {string} */ _, /** @type {number} */ colIdx) => {
        const td = document.createElement('td');
        td.style.textAlign = tableBlock.alignments[colIdx] || 'left';
        td.innerHTML = renderInlineMarkdown(rowCells[colIdx] || '');
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  /**
   * @param {any} block
   * @returns {HTMLElement}
   */
  function renderAstBlock(block) {
    const { renderInlineMarkdown } = ns.parser;
    switch (block.type) {
      case 'heading': {
        const tag = block.level === 3 ? 'h3' : 'h4';
        const heading = document.createElement(tag);
        heading.id = block.id;
        heading.className = `cl-subheading cl-subheading--h${block.level}`;
        heading.innerHTML = renderInlineMarkdown(block.text);
        return heading;
      }
      case 'paragraph': {
        const p = document.createElement('p');
        p.className = 'cl-paragraph';
        p.innerHTML = renderInlineMarkdown(block.text);
        return p;
      }
      case 'code':
        return ns.CodeBlock.createCodeBlock(block);
      case 'callout':
        return ns.CalloutBox.createCalloutBox(block);
      case 'list':
        return renderListElement(block);
      case 'table':
        return renderTableElement(block);
      case 'hr': {
        const hr = document.createElement('hr');
        hr.className = 'cl-divider';
        return hr;
      }
      default:
        return document.createElement('div');
    }
  }

  /**
   * @param {Object} params
   * @param {HTMLElement} params.container
   * @param {any} params.codelab
   * @param {() => void} params.onBackToIndex
   * @param {() => void} params.onToggleTheme
   * @param {() => 'dark' | 'light'} params.getTheme
   * @returns {() => void}
   */
  function renderCodelabReader({
    container,
    codelab,
    onBackToIndex,
    onToggleTheme,
    getTheme,
  }) {
    const { escapeHtml, formatMinutesLabel } = ns.parser;
    const { useCodelabProgress } = ns.progress;
    const { createCodelabSidebar } = ns.CodelabSidebar;
    const { getCatalogHref } = ns.urls;

    container.innerHTML = '';

    const { metadata, steps } = codelab;
    const progressController = useCodelabProgress(metadata.id, steps.length);
    const catalogHref = escapeHtml(getCatalogHref());
    const feedbackHref =
      metadata.feedbackLink && metadata.feedbackLink !== 'https://github.com/'
        ? metadata.feedbackLink
        : 'https://github.com/maureenbarahona';

    let renderedStepIndex = -1;
    let completionModalOpen = false;

    const shellEl = document.createElement('div');
    shellEl.className = 'cl-reader-shell';

    const topbar = document.createElement('header');
    topbar.className = 'cl-topbar cl-topbar--reader';
    topbar.innerHTML = `
      <div class="cl-topbar__inner">
        <div class="cl-topbar__left">
          <button
            type="button"
            class="cl-mobile-steps-btn"
            data-open-drawer
            aria-label="Abrir índice de pasos"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
            <span>Pasos</span>
          </button>
          <a href="${catalogHref}" class="cl-back-btn" data-back-index title="Volver al índice de Codelabs">
            <span aria-hidden="true">←</span>
            <span class="cl-back-btn__text">Codelabs</span>
          </a>
          <span class="cl-topbar__divider cl-hide-sm" aria-hidden="true">/</span>
          <h1 class="cl-topbar__codelab-title">${escapeHtml(metadata.title)}</h1>
        </div>

        <div class="cl-topbar__right">
          <div class="cl-remaining-pill" title="Tiempo estimado restante">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span data-remaining-label></span>
          </div>

          <button type="button" class="cl-theme-btn" data-theme-toggle aria-label="Cambiar modo de lectura">
            <span data-theme-icon>${getTheme() === 'light' ? '☾' : '☀'}</span>
            <span class="cl-theme-btn__text" data-theme-label>${getTheme() === 'light' ? 'Oscuro' : 'Claro'}</span>
          </button>

          <a
            href="${escapeHtml(feedbackHref)}"
            target="_blank"
            rel="noopener noreferrer"
            class="cl-feedback-link cl-hide-sm"
            title="Enviar comentarios o visitar GitHub"
          >
            Feedback ↗
          </a>
        </div>
      </div>
      <div
        class="cl-top-progress"
        role="progressbar"
        aria-label="Progreso del codelab"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow="0"
        data-top-progressbar
      >
        <div class="cl-top-progress__fill" data-top-progress-fill></div>
      </div>
    `;

    const workspaceEl = document.createElement('div');
    workspaceEl.className = 'cl-reader-workspace';

    const sidebar = createCodelabSidebar({
      steps,
      progress: progressController.getState(),
      onSelectStep: (targetIdx) => {
        const current = progressController.getState().currentStep;
        const markPrev = targetIdx === current + 1;
        progressController.goToStep(targetIdx, {
          markPreviousCompleted: markPrev,
          previousStep: current,
        });
      },
      onResetProgress: () => {
        completionModalOpen = false;
        completionModalEl.hidden = true;
        progressController.resetProgress();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });

    const mainColumn = document.createElement('main');
    mainColumn.className = 'cl-reader-main';
    mainColumn.id = 'codelab-main-content';

    const articleWrap = document.createElement('article');
    articleWrap.className = 'cl-reader-article';

    const navBarBottom = document.createElement('nav');
    navBarBottom.className = 'cl-step-nav';
    navBarBottom.setAttribute('aria-label', 'Controles de navegación entre pasos');
    navBarBottom.innerHTML = `
      <button type="button" class="cl-btn cl-btn--nav-prev" data-prev-step>
        ← Anterior
      </button>
      <div class="cl-step-nav__center">
        <span class="cl-step-nav__counter" data-step-counter></span>
      </div>
      <button type="button" class="cl-btn cl-btn--primary cl-btn--nav-next" data-next-step>
        Siguiente paso →
      </button>
    `;

    const completionModalEl = document.createElement('section');
    completionModalEl.className = 'cl-completion-banner';
    completionModalEl.hidden = true;
    completionModalEl.setAttribute('aria-live', 'polite');
    completionModalEl.innerHTML = `
      <div class="cl-completion-banner__card">
        <div class="cl-completion-banner__badge">🎉 ¡Codelab Completado!</div>
        <h2 class="cl-completion-banner__title">¡Excelente trabajo! Finalizaste "${escapeHtml(metadata.title)}"</h2>
        <p class="cl-completion-banner__desc">
          Completaste los <strong>${steps.length} pasos</strong> (${formatMinutesLabel(metadata.totalDurationMinutes)} de práctica guiada). Tu progreso quedó guardado en este navegador.
        </p>
        <div class="cl-completion-banner__actions">
          <button type="button" class="cl-btn cl-btn--primary" data-share-codelab>
            Compartir logro 🔗
          </button>
          <button type="button" class="cl-btn cl-btn--secondary" data-restart-codelab>
            Reiniciar progreso ↺
          </button>
          <a href="${catalogHref}" class="cl-btn cl-btn--ghost" data-finish-back>
            Ver todos los Codelabs
          </a>
        </div>
        <p class="cl-completion-banner__feedback" data-share-feedback hidden></p>
      </div>
    `;

    mainColumn.appendChild(articleWrap);
    mainColumn.appendChild(completionModalEl);
    mainColumn.appendChild(navBarBottom);

    workspaceEl.appendChild(sidebar.backdropEl);
    workspaceEl.appendChild(sidebar.asideEl);
    workspaceEl.appendChild(mainColumn);

    shellEl.appendChild(topbar);
    shellEl.appendChild(workspaceEl);
    container.appendChild(shellEl);

    const openDrawerBtn = topbar.querySelector('[data-open-drawer]');
    const backLink = topbar.querySelector('[data-back-index]');
    const remainingLabel = topbar.querySelector('[data-remaining-label]');
    const themeToggleBtn = topbar.querySelector('[data-theme-toggle]');
    const progressBarEl = topbar.querySelector('[data-top-progressbar]');
    const progressFillEl = /** @type {HTMLElement | null} */ (
      topbar.querySelector('[data-top-progress-fill]')
    );

    const prevBtn = /** @type {HTMLButtonElement | null} */ (
      navBarBottom.querySelector('[data-prev-step]')
    );
    const nextBtn = /** @type {HTMLButtonElement | null} */ (
      navBarBottom.querySelector('[data-next-step]')
    );
    const stepCounterEl = navBarBottom.querySelector('[data-step-counter]');

    const shareBtn = completionModalEl.querySelector('[data-share-codelab]');
    const restartBtn = completionModalEl.querySelector('[data-restart-codelab]');
    const finishBackLink = completionModalEl.querySelector('[data-finish-back]');
    const shareFeedbackEl = /** @type {HTMLElement | null} */ (
      completionModalEl.querySelector('[data-share-feedback]')
    );

    if (openDrawerBtn) {
      openDrawerBtn.addEventListener('click', () => {
        sidebar.toggleMobile();
      });
    }

    const handleBackClick = (/** @type {Event} */ e) => {
      const mouseEv = /** @type {MouseEvent} */ (e);
      if (
        mouseEv.metaKey ||
        mouseEv.ctrlKey ||
        mouseEv.shiftKey ||
        mouseEv.altKey ||
        mouseEv.button !== 0
      ) {
        return;
      }
      e.preventDefault();
      sidebar.closeMobile();
      onBackToIndex();
    };

    if (backLink) backLink.addEventListener('click', handleBackClick);
    if (finishBackLink) finishBackLink.addEventListener('click', handleBackClick);

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        onToggleTheme();
        const iconEl = themeToggleBtn.querySelector('[data-theme-icon]');
        const labelEl = themeToggleBtn.querySelector('[data-theme-label]');
        const current = getTheme();
        if (iconEl) iconEl.textContent = current === 'light' ? '☾' : '☀';
        if (labelEl) labelEl.textContent = current === 'light' ? 'Oscuro' : 'Claro';
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        completionModalOpen = false;
        completionModalEl.hidden = true;
        progressController.prevStep();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const state = progressController.getState();
        const isLastStep = state.currentStep >= steps.length - 1;
        if (isLastStep) {
          progressController.finishCodelab();
          completionModalOpen = true;
          completionModalEl.hidden = false;
          completionModalEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          completionModalOpen = false;
          completionModalEl.hidden = true;
          progressController.nextStep();
        }
      });
    }

    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        const canonicalShareUrl = ns.urls.isFile
          ? `https://maureenbarahona.foo/codelabs/${encodeURIComponent(metadata.id)}`
          : window.location.href;
        const shareTitle = `${metadata.title} · Codelab por ${metadata.authors}`;
        const shareText = `Acabo de completar el codelab interactivo "${metadata.title}" en maureenbarahona.foo 🚀`;

        if (!ns.urls.isFile && navigator.share) {
          try {
            await navigator.share({ title: shareTitle, text: shareText, url: canonicalShareUrl });
            return;
          } catch {
            // Fall back to clipboard copy
          }
        }

        const ok = await ns.CodeBlock.copyTextToClipboard(canonicalShareUrl);
        if (shareFeedbackEl) {
          shareFeedbackEl.hidden = false;
          shareFeedbackEl.textContent = ok
            ? `✓ ¡Enlace copiado: ${canonicalShareUrl}!`
            : canonicalShareUrl;
          window.setTimeout(() => {
            shareFeedbackEl.hidden = true;
          }, 3500);
        }
      });
    }

    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        completionModalOpen = false;
        completionModalEl.hidden = true;
        progressController.resetProgress();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    /**
     * @param {number} stepIdx
     * @param {boolean} shouldScroll
     */
    function mountStepContent(stepIdx, shouldScroll) {
      const step = steps[stepIdx];
      if (!step) return;

      articleWrap.innerHTML = '';

      const header = document.createElement('header');
      header.className = 'cl-step-header';

      const metaPillsHtml =
        stepIdx === 0
          ? `
            <div class="cl-step-header__intro-meta">
              ${metadata.categories
                .map(
                  (/** @type {string} */ cat) =>
                    `<span class="cl-cat-badge cl-cat-badge--${escapeHtml(cat.toLowerCase())}">${escapeHtml(cat)}</span>`
                )
                .join('')}
              ${metadata.byline ? `<span class="cl-step-header__byline">${escapeHtml(metadata.byline)}</span>` : ''}
            </div>
          `
          : '';

      header.innerHTML = `
        ${metaPillsHtml}
        <div class="cl-step-header__kicker">
          <span class="cl-step-header__badge">Paso ${step.stepNumber} de ${steps.length}</span>
          <span class="cl-step-header__duration">Duración estimada: ${formatMinutesLabel(step.durationMinutes)}</span>
        </div>
        <h2 class="cl-step-header__title">${escapeHtml(step.rawTitle)}</h2>
      `;

      const body = document.createElement('div');
      body.className = 'cl-step-body';
      step.blocks.forEach((/** @type {any} */ block) => {
        body.appendChild(renderAstBlock(block));
      });

      articleWrap.appendChild(header);
      articleWrap.appendChild(body);

      if (shouldScroll) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    function syncView(/** @type {boolean} */ isInitialMount = false) {
      const state = progressController.getState();
      const activeStep = steps[state.currentStep] || steps[0];
      const stepChanged = renderedStepIndex !== state.currentStep;

      if (stepChanged) {
        const shouldScroll = !isInitialMount && renderedStepIndex !== -1;
        renderedStepIndex = state.currentStep;
        mountStepContent(state.currentStep, shouldScroll);
        if (!completionModalOpen) {
          completionModalEl.hidden = true;
        }
      }

      sidebar.update(state);

      const visualPct = state.isFinished
        ? 100
        : Math.round(
            (Math.max(state.completedSteps.length, state.currentStep + 0.35) / steps.length) * 100
          );
      const clampedPct = Math.min(100, Math.max(4, visualPct));

      if (progressBarEl) {
        progressBarEl.setAttribute('aria-valuenow', String(clampedPct));
      }
      if (progressFillEl) {
        progressFillEl.style.width = `${clampedPct}%`;
      }

      if (remainingLabel && activeStep) {
        if (state.isFinished) {
          remainingLabel.textContent = '¡Completado! 🎉';
        } else {
          remainingLabel.textContent = `${formatMinutesLabel(activeStep.remainingMinutes)} restantes`;
        }
      }

      if (stepCounterEl) {
        stepCounterEl.textContent = `${state.currentStep + 1} / ${steps.length}`;
      }

      if (prevBtn) {
        prevBtn.disabled = state.currentStep === 0;
        prevBtn.style.visibility = state.currentStep === 0 ? 'hidden' : 'visible';
      }

      if (nextBtn) {
        const isLast = state.currentStep >= steps.length - 1;
        if (isLast) {
          nextBtn.textContent = state.isFinished ? 'Codelab Finalizado 🎉' : 'Finalizar Codelab 🎉';
          nextBtn.classList.add('cl-btn--finish');
        } else {
          nextBtn.textContent = 'Siguiente paso →';
          nextBtn.classList.remove('cl-btn--finish');
        }
      }
    }

    /**
     * @param {KeyboardEvent} event
     */
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        sidebar.closeMobile();
        return;
      }

      if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          const state = progressController.getState();
          if (state.currentStep < steps.length - 1) {
            completionModalOpen = false;
            completionModalEl.hidden = true;
            progressController.nextStep();
          } else {
            progressController.finishCodelab();
            completionModalOpen = true;
            completionModalEl.hidden = false;
            completionModalEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          const state = progressController.getState();
          if (state.currentStep > 0) {
            completionModalOpen = false;
            completionModalEl.hidden = true;
            progressController.prevStep();
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    const unsubscribe = progressController.subscribe(() => syncView(false));

    syncView(true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unsubscribe();
      sidebar.closeMobile();
    };
  }

  ns.CodelabReader = { renderCodelabReader };
})();
