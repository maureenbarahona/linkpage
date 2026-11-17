// @ts-check
(function () {
  const ns = (window.MauCodelabs = window.MauCodelabs || {});

  const STEP_CHECK_SVG = `
<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <polyline points="20 6 9 17 4 12"></polyline>
</svg>`;

  /**
   * @param {Object} params
   * @param {any[]} params.steps
   * @param {any} params.progress
   * @param {(stepIndex: number) => void} params.onSelectStep
   * @param {() => void} params.onResetProgress
   */
  function createCodelabSidebar({ steps, progress, onSelectStep, onResetProgress }) {
    const { escapeHtml, formatMinutesLabel } = ns.parser;

    const backdropEl = document.createElement('div');
    backdropEl.className = 'cl-sidebar-backdrop';
    backdropEl.setAttribute('aria-hidden', 'true');

    const asideEl = document.createElement('aside');
    asideEl.className = 'cl-sidebar';
    asideEl.setAttribute('aria-label', 'Índice de pasos del codelab');

    const drawerHeader = document.createElement('div');
    drawerHeader.className = 'cl-sidebar__header';
    drawerHeader.innerHTML = `
      <div class="cl-sidebar__heading-group">
        <span class="cl-sidebar__eyebrow">Contenido del taller</span>
        <span class="cl-sidebar__stats" data-sidebar-stats></span>
      </div>
      <button type="button" class="cl-sidebar__close-btn" aria-label="Cerrar menú de pasos">✕</button>
    `;

    const navEl = document.createElement('nav');
    navEl.className = 'cl-sidebar__nav';
    const olEl = document.createElement('ol');
    olEl.className = 'cl-stepper';

    /** @type {HTMLButtonElement[]} */
    const stepButtons = [];

    steps.forEach((step) => {
      const li = document.createElement('li');
      li.className = 'cl-stepper__item';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cl-stepper__btn';
      btn.dataset.stepIndex = String(step.index);

      btn.innerHTML = `
        <span class="cl-stepper__indicator" data-indicator>${step.stepNumber}</span>
        <span class="cl-stepper__content">
          <span class="cl-stepper__title">${escapeHtml(step.title)}</span>
          <span class="cl-stepper__meta">${formatMinutesLabel(step.durationMinutes)}</span>
        </span>
      `;

      btn.addEventListener('click', () => {
        onSelectStep(step.index);
        closeMobile();
      });

      stepButtons.push(btn);
      li.appendChild(btn);
      olEl.appendChild(li);
    });

    navEl.appendChild(olEl);

    const footerEl = document.createElement('div');
    footerEl.className = 'cl-sidebar__footer';

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'cl-sidebar__reset-btn';
    resetBtn.textContent = 'Reiniciar progreso';
    resetBtn.addEventListener('click', () => {
      onResetProgress();
      closeMobile();
    });

    const shortcutHint = document.createElement('p');
    shortcutHint.className = 'cl-sidebar__shortcut-hint';
    shortcutHint.innerHTML = 'Atajo: <kbd>Alt</kbd> + <kbd>←</kbd> / <kbd>→</kbd>';

    footerEl.appendChild(shortcutHint);
    footerEl.appendChild(resetBtn);

    asideEl.appendChild(drawerHeader);
    asideEl.appendChild(navEl);
    asideEl.appendChild(footerEl);

    let isMobileOpen = false;

    function openMobile() {
      isMobileOpen = true;
      asideEl.classList.add('is-open');
      backdropEl.classList.add('is-visible');
      document.body.classList.add('cl-drawer-open');
    }

    function closeMobile() {
      isMobileOpen = false;
      asideEl.classList.remove('is-open');
      backdropEl.classList.remove('is-visible');
      document.body.classList.remove('cl-drawer-open');
    }

    function toggleMobile() {
      if (isMobileOpen) {
        closeMobile();
      } else {
        openMobile();
      }
      return isMobileOpen;
    }

    backdropEl.addEventListener('click', closeMobile);
    const closeBtn = drawerHeader.querySelector('.cl-sidebar__close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeMobile);
    }

    /**
     * @param {any} snapshot
     */
    function update(snapshot) {
      const completedSet = new Set(snapshot.completedSteps);
      const statsEl = drawerHeader.querySelector('[data-sidebar-stats]');
      if (statsEl) {
        statsEl.textContent = `${completedSet.size} de ${steps.length} completados`;
      }

      stepButtons.forEach((btn, idx) => {
        const step = steps[idx];
        const isActive = idx === snapshot.currentStep;
        const isCompleted = completedSet.has(idx);
        const indicator = btn.querySelector('[data-indicator]');

        btn.classList.toggle('is-active', isActive);
        btn.classList.toggle('is-completed', isCompleted && !isActive);
        btn.classList.toggle('is-completed-active', isCompleted && isActive);

        if (isActive) {
          btn.setAttribute('aria-current', 'step');
        } else {
          btn.removeAttribute('aria-current');
        }

        if (indicator) {
          if (isCompleted && !isActive) {
            indicator.innerHTML = STEP_CHECK_SVG;
          } else {
            indicator.textContent = String(step.stepNumber);
          }
        }
      });

      resetBtn.hidden =
        !snapshot.hasStarted ||
        (snapshot.completedSteps.length === 0 && snapshot.currentStep === 0);
    }

    update(progress);

    return {
      asideEl,
      backdropEl,
      update,
      openMobile,
      closeMobile,
      toggleMobile,
    };
  }

  ns.CodelabSidebar = { createCodelabSidebar };
})();
