// @ts-check
(function () {
  const ns = (window.MauCodelabs = window.MauCodelabs || {});
  const DEFAULT_CATEGORIES = ['Cloud', 'AI', 'Web', 'HealthTech'];

  /**
   * @param {Object} params
   * @param {HTMLElement} params.container
   * @param {any[]} params.codelabs
   * @param {(codelabId: string) => void} params.onNavigateCodelab
   * @param {() => void} params.onToggleTheme
   * @param {() => 'dark' | 'light'} params.getTheme
   */
  function renderCodelabList({
    container,
    codelabs,
    onNavigateCodelab,
    onToggleTheme,
    getTheme,
  }) {
    const { escapeHtml, formatMinutesLabel } = ns.parser;
    const { getCodelabProgressSnapshot } = ns.progress;
    const { getHomeHref, getCodelabHref, getPublicAssetHref } = ns.urls;

    container.innerHTML = '';

    let activeCategory = 'Todos';
    let activeTag = '';
    let searchQuery = '';

    const categorySet = new Set(DEFAULT_CATEGORIES);
    codelabs.forEach((item) => {
      item.metadata.categories.forEach((/** @type {string} */ cat) => categorySet.add(cat));
    });
    const categories = ['Todos', ...Array.from(categorySet)];

    /** @type {Set<string>} */
    const tagSet = new Set();
    codelabs.forEach((item) => {
      item.metadata.tags.forEach((/** @type {string} */ tag) => tagSet.add(tag));
    });
    const allTags = Array.from(tagSet);

    const totalMinutes = codelabs.reduce((acc, c) => acc + c.metadata.totalDurationMinutes, 0);
    const homeHref = escapeHtml(getHomeHref());
    const logoSrc = escapeHtml(getPublicAssetHref('img/logo.png'));

    const pageEl = document.createElement('div');
    pageEl.className = 'cl-catalog-page';

    const topbar = document.createElement('header');
    topbar.className = 'cl-topbar';
    topbar.innerHTML = `
      <div class="cl-topbar__inner cl-topbar__inner--wide">
        <div class="cl-topbar__left">
          <a href="${homeHref}" class="cl-brand-link" aria-label="Volver al inicio de maureenbarahona.foo">
            <img src="${logoSrc}" alt="MauDev" class="cl-brand-link__logo" width="32" height="32" />
            <span class="cl-brand-link__name">MauDev</span>
          </a>
          <span class="cl-topbar__divider" aria-hidden="true">/</span>
          <span class="cl-topbar__section-badge">Codelabs</span>
        </div>
        <div class="cl-topbar__right">
          <a href="${homeHref}" class="cl-ghost-link">← Inicio</a>
          <button type="button" class="cl-theme-btn" data-theme-toggle aria-label="Cambiar modo de lectura">
            <span data-theme-icon>${getTheme() === 'light' ? '☾' : '☀'}</span>
            <span class="cl-theme-btn__text" data-theme-label>${getTheme() === 'light' ? 'Oscuro' : 'Claro'}</span>
          </button>
        </div>
      </div>
    `;

    const themeBtn = topbar.querySelector('[data-theme-toggle]');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        onToggleTheme();
        const iconEl = themeBtn.querySelector('[data-theme-icon]');
        const labelEl = themeBtn.querySelector('[data-theme-label]');
        const current = getTheme();
        if (iconEl) iconEl.textContent = current === 'light' ? '☾' : '☀';
        if (labelEl) labelEl.textContent = current === 'light' ? 'Oscuro' : 'Claro';
      });
    }

    const hero = document.createElement('section');
    hero.className = 'cl-hero';
    hero.innerHTML = `
      <div class="cl-hero__inner">
        <div class="cl-hero__badges">
          <span class="cl-pill cl-pill--autumn">GDE Cloud &amp; WTM Ambassador</span>
          <span class="cl-pill cl-pill--cobalt">Aprende Haciendo · Paso a Paso</span>
        </div>
        <h1 class="cl-hero__title">Codelabs Interactivos</h1>
        <p class="cl-hero__subtitle">
          Laboratorios técnicos guiados por <strong>Maureen Barahona</strong> para diseñar, construir y desplegar soluciones reales en Cloud, IA Generativa, Desarrollo Agéntico y HealthTech.
        </p>
        <div class="cl-hero__metrics">
          <div class="cl-metric">
            <span class="cl-metric__value">${codelabs.length}</span>
            <span class="cl-metric__label">${codelabs.length === 1 ? 'Taller publicado' : 'Talleres publicados'}</span>
          </div>
          <div class="cl-metric__sep" aria-hidden="true"></div>
          <div class="cl-metric">
            <span class="cl-metric__value">${formatMinutesLabel(totalMinutes)}</span>
            <span class="cl-metric__label">Práctica guiada</span>
          </div>
          <div class="cl-metric__sep" aria-hidden="true"></div>
          <div class="cl-metric">
            <span class="cl-metric__value">100%</span>
            <span class="cl-metric__label">Progreso autoguardado</span>
          </div>
        </div>
      </div>
    `;

    const controlsSection = document.createElement('section');
    controlsSection.className = 'cl-controls';
    controlsSection.setAttribute('aria-label', 'Filtros de búsqueda de codelabs');

    const controlsInner = document.createElement('div');
    controlsInner.className = 'cl-controls__inner';

    const filterRow = document.createElement('div');
    filterRow.className = 'cl-controls__top-row';

    const categoryNav = document.createElement('div');
    categoryNav.className = 'cl-category-pills';
    categoryNav.setAttribute('role', 'tablist');
    categoryNav.setAttribute('aria-label', 'Filtrar por categoría');

    const searchWrap = document.createElement('div');
    searchWrap.className = 'cl-search-wrap';
    searchWrap.innerHTML = `
      <svg class="cl-search-wrap__icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <input
        type="search"
        class="cl-search-input"
        placeholder="Buscar por tema, herramienta o tag..."
        aria-label="Buscar codelabs"
      />
    `;

    const searchInput = /** @type {HTMLInputElement | null} */ (
      searchWrap.querySelector('.cl-search-input')
    );

    filterRow.appendChild(categoryNav);
    filterRow.appendChild(searchWrap);

    const tagsRow = document.createElement('div');
    tagsRow.className = 'cl-tags-bar';

    controlsInner.appendChild(filterRow);
    if (allTags.length > 0) {
      controlsInner.appendChild(tagsRow);
    }
    controlsSection.appendChild(controlsInner);

    const mainEl = document.createElement('main');
    mainEl.className = 'cl-catalog-main';
    const gridEl = document.createElement('div');
    gridEl.className = 'cl-cards-grid';
    mainEl.appendChild(gridEl);

    const footer = document.createElement('footer');
    footer.className = 'cl-catalog-footer';
    footer.innerHTML = `
      <div class="cl-catalog-footer__inner">
        <p>© ${new Date().getFullYear()} <a href="${homeHref}">Maureen Barahona (MauDev)</a> · SRE / DevOps &amp; Google Developer Expert in Cloud.</p>
        <div class="cl-catalog-footer__links">
          <a href="https://github.com/maureenbarahona" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://www.linkedin.com/in/maureen-barahona/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href="https://medium.com/@maureenbarahona" target="_blank" rel="noopener noreferrer">Medium</a>
        </div>
      </div>
    `;

    function renderFilterButtons() {
      categoryNav.innerHTML = '';
      categories.forEach((cat) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        const isSelected = activeCategory.toLowerCase() === cat.toLowerCase();
        btn.className = `cl-filter-pill${isSelected ? ' is-active' : ''}`;
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', String(isSelected));
        btn.textContent = cat;
        btn.addEventListener('click', () => {
          activeCategory = cat;
          renderFilterButtons();
          renderGrid();
        });
        categoryNav.appendChild(btn);
      });

      tagsRow.innerHTML = '<span class="cl-tags-bar__label">Tags:</span>';
      allTags.forEach((tag) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        const isTagActive = activeTag.toLowerCase() === tag.toLowerCase();
        chip.className = `cl-tag-chip${isTagActive ? ' is-active' : ''}`;
        chip.textContent = `#${tag}`;
        chip.addEventListener('click', () => {
          activeTag = isTagActive ? '' : tag;
          renderFilterButtons();
          renderGrid();
        });
        tagsRow.appendChild(chip);
      });
    }

    function renderGrid() {
      gridEl.innerHTML = '';

      const normalizedSearch = searchQuery.trim().toLowerCase();
      const filtered = codelabs.filter((codelab) => {
        const { metadata } = codelab;
        const matchesCat =
          activeCategory === 'Todos' ||
          metadata.categories.some(
            (/** @type {string} */ c) => c.toLowerCase() === activeCategory.toLowerCase()
          );

        const matchesTag =
          !activeTag ||
          metadata.tags.some(
            (/** @type {string} */ t) => t.toLowerCase() === activeTag.toLowerCase()
          );

        const matchesSearch =
          !normalizedSearch ||
          metadata.title.toLowerCase().includes(normalizedSearch) ||
          metadata.summary.toLowerCase().includes(normalizedSearch) ||
          metadata.categories.some((/** @type {string} */ c) =>
            c.toLowerCase().includes(normalizedSearch)
          ) ||
          metadata.tags.some((/** @type {string} */ t) =>
            t.toLowerCase().includes(normalizedSearch)
          );

        return matchesCat && matchesTag && matchesSearch;
      });

      if (filtered.length === 0) {
        const emptyEl = document.createElement('div');
        emptyEl.className = 'cl-empty-state';
        emptyEl.innerHTML = `
          <p class="cl-empty-state__title">No hay talleres que coincidan con el filtro seleccionado.</p>
          <p class="cl-empty-state__desc">Prueba seleccionando otra categoría o limpiando los filtros activos.</p>
          <button type="button" class="cl-btn cl-btn--secondary" data-clear-filters>Mostrar todos los codelabs</button>
        `;
        const clearBtn = emptyEl.querySelector('[data-clear-filters]');
        if (clearBtn) {
          clearBtn.addEventListener('click', () => {
            activeCategory = 'Todos';
            activeTag = '';
            searchQuery = '';
            if (searchInput) searchInput.value = '';
            renderFilterButtons();
            renderGrid();
          });
        }
        gridEl.appendChild(emptyEl);
        return;
      }

      filtered.forEach((codelab) => {
        const { metadata, steps } = codelab;
        const progress = getCodelabProgressSnapshot(metadata.id, steps.length);
        const href = escapeHtml(getCodelabHref(metadata.id));

        const card = document.createElement('article');
        card.className = `cl-card${metadata.featured ? ' cl-card--featured' : ''}`;

        const categoriesHtml = metadata.categories
          .map(
            (/** @type {string} */ cat) =>
              `<span class="cl-cat-badge cl-cat-badge--${escapeHtml(cat.toLowerCase())}">${escapeHtml(cat)}</span>`
          )
          .join('');

        const tagsHtml = metadata.tags
          .map((/** @type {string} */ tag) => `<span class="cl-card__tag">#${escapeHtml(tag)}</span>`)
          .join('');

        let ctaText = 'Iniciar Codelab →';
        let progressHtml = '';

        if (progress.hasStarted && (progress.currentStep > 0 || progress.completedSteps.length > 0 || progress.isFinished)) {
          if (progress.isFinished) {
            ctaText = 'Repasar Codelab →';
            progressHtml = `
              <div class="cl-card__progress cl-card__progress--done">
                <div class="cl-card__progress-meta">
                  <span class="cl-card__progress-status">✓ Taller completado</span>
                  <span class="cl-card__progress-pct">100%</span>
                </div>
                <div class="cl-card__progress-track" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100">
                  <div class="cl-card__progress-fill" style="width: 100%"></div>
                </div>
              </div>
            `;
          } else {
            const stepHuman = progress.currentStep + 1;
            ctaText = `Continuar (Paso ${stepHuman}/${steps.length}) →`;
            progressHtml = `
              <div class="cl-card__progress">
                <div class="cl-card__progress-meta">
                  <span class="cl-card__progress-status">En curso · Paso ${stepHuman} de ${steps.length}</span>
                  <span class="cl-card__progress-pct">${progress.percent}%</span>
                </div>
                <div class="cl-card__progress-track" role="progressbar" aria-valuenow="${progress.percent}" aria-valuemin="0" aria-valuemax="100">
                  <div class="cl-card__progress-fill" style="width: ${Math.max(6, progress.percent)}%"></div>
                </div>
              </div>
            `;
          }
        }

        card.innerHTML = `
          <div class="cl-card__top">
            <div class="cl-card__categories">${categoriesHtml}</div>
            <div class="cl-card__duration" title="Duración total estimada">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>${formatMinutesLabel(metadata.totalDurationMinutes)} · ${steps.length} pasos</span>
            </div>
          </div>
          <h2 class="cl-card__title">
            <a href="${href}" class="cl-card__title-link" data-codelab-link="${escapeHtml(metadata.id)}">
              ${escapeHtml(metadata.title)}
            </a>
          </h2>
          <p class="cl-card__summary">${escapeHtml(metadata.summary)}</p>
          <div class="cl-card__tags">${tagsHtml}</div>
          ${progressHtml}
          <div class="cl-card__footer">
            <span class="cl-card__author">Por ${escapeHtml(metadata.authors)}</span>
            <a href="${href}" class="cl-btn cl-btn--primary" data-codelab-link="${escapeHtml(metadata.id)}">
              ${escapeHtml(ctaText)}
            </a>
          </div>
        `;

        card.querySelectorAll('[data-codelab-link]').forEach((anchor) => {
          anchor.addEventListener('click', (e) => {
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
            onNavigateCodelab(metadata.id);
          });
        });

        gridEl.appendChild(card);
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        searchQuery = searchInput.value;
        renderGrid();
      });
    }

    renderFilterButtons();
    renderGrid();

    pageEl.appendChild(topbar);
    pageEl.appendChild(hero);
    pageEl.appendChild(controlsSection);
    pageEl.appendChild(mainEl);
    pageEl.appendChild(footer);
    container.appendChild(pageEl);
  }

  ns.CodelabList = { renderCodelabList };
})();
