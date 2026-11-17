// @ts-check
(function () {
  const ns = (window.MauCodelabs = window.MauCodelabs || {});
  const THEME_STORAGE_KEY = 'maudev_codelabs_theme_v1';

  /** @type {(() => void) | null} */
  let activeCleanup = null;

  /**
   * @returns {'dark' | 'light'}
   */
  function getTheme() {
    try {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {
      // Ignore storage errors
    }
    return 'dark';
  }

  /**
   * @param {'dark' | 'light'} theme
   */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors
    }
  }

  function toggleTheme() {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  }

  /**
   * Extracts active codelab slug across all routing modes:
   *  - Query string: `?id=nutriapp-antigravity-stitch-cloudrun`
   *  - Hash (`file://` or subfolder static server): `#nutriapp-antigravity-stitch-cloudrun`
   *  - Clean path (`maureenbarahona.foo` / static subfolder): `/codelabs/nutriapp-antigravity-stitch-cloudrun`
   * @returns {string | null}
   */
  function resolveRouteSlug() {
    const params = new URLSearchParams(window.location.search);
    const queryId = params.get('id');
    if (queryId && queryId.trim()) {
      return queryId.trim().replace(/\.md$/i, '');
    }

    const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
    if (rawHash && !rawHash.startsWith('step-')) {
      return decodeURIComponent(rawHash).replace(/\.md$/i, '');
    }

    // Match `/codelabs/<slug>` or `/codelabs/<slug>/index.html`
    const pathNoIndex = window.location.pathname
      .replace(/\/index\.html$/i, '')
      .replace(/\/+$/, '');
    const match = pathNoIndex.match(/\/codelabs\/([^/]+)$/i);
    if (match && match[1]) {
      return decodeURIComponent(match[1]).replace(/\.md$/i, '');
    }

    return null;
  }

  /**
   * @param {string} title
   * @param {string} description
   */
  function updateDocumentMeta(title, description) {
    document.title = title;
    const descTag = document.querySelector('meta[name="description"]');
    if (descTag && description) {
      descTag.setAttribute('content', description);
    }
  }

  /**
   * @param {HTMLElement} root
   * @param {string} message
   */
  function renderLoading(root, message) {
    const { escapeHtml } = ns.parser;
    root.innerHTML = `
      <div class="cl-state-screen" role="status" aria-live="polite">
        <div class="cl-spinner" aria-hidden="true"></div>
        <p class="cl-state-screen__text">${escapeHtml(message)}</p>
      </div>
    `;
  }

  /**
   * @param {HTMLElement} root
   * @param {string} message
   * @param {() => void} onGoCatalog
   */
  function renderError(root, message, onGoCatalog) {
    const { escapeHtml } = ns.parser;
    const catalogHref = escapeHtml(ns.urls.getCatalogHref());
    const homeHref = escapeHtml(ns.urls.getHomeHref());

    root.innerHTML = `
      <div class="cl-state-screen cl-state-screen--error" role="alert">
        <span class="cl-pill cl-pill--autumn">Codelab no encontrado</span>
        <h1 class="cl-state-screen__title">No pudimos abrir este taller</h1>
        <p class="cl-state-screen__text">${escapeHtml(message)}</p>
        <div class="cl-state-screen__actions">
          <a href="${catalogHref}" class="cl-btn cl-btn--primary" data-back-catalog>← Explorar Codelabs disponibles</a>
          <a href="${homeHref}" class="cl-btn cl-btn--ghost">Ir a maureenbarahona.foo</a>
        </div>
      </div>
    `;
    const btn = root.querySelector('[data-back-catalog]');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        onGoCatalog();
      });
    }
  }

  /**
   * Navigates cleanly between Catalog and Reader in both `file://` and `http(s)://`.
   * @param {string | null} slug
   * @param {{ replace?: boolean }} [opts]
   */
  async function navigateTo(slug, opts = {}) {
    if (ns.urls.supportsCleanRoutes()) {
      const targetUrl = slug ? ns.urls.getCodelabHref(slug) : ns.urls.getCatalogHref();
      if (window.location.pathname !== targetUrl || window.location.search || window.location.hash) {
        try {
          if (opts.replace) {
            window.history.replaceState({ slug }, '', targetUrl);
          } else {
            window.history.pushState({ slug }, '', targetUrl);
          }
        } catch {
          window.location.hash = slug ? encodeURIComponent(slug) : '';
        }
      }
      await renderCurrentRoute();
    } else {
      // On `file://` or subfolder mounts (e.g. `/public/codelabs/`):
      // If currently inside a subfolder like `/codelabs/nutriapp-.../index.html` and going to catalog, navigate to catalog `index.html`.
      const onSubfolderPage = /\/codelabs\/[^/]+\/index\.html$/i.test(window.location.pathname);
      if (!slug && onSubfolderPage) {
        window.location.href = ns.urls.getCatalogHref();
        return;
      }

      if (slug) {
        const nextHash = `#${encodeURIComponent(slug)}`;
        if (window.location.hash !== nextHash) {
          window.location.hash = nextHash;
          return; // `hashchange` listener will trigger `renderCurrentRoute()`
        }
      } else if (window.location.hash) {
        try {
          window.history.pushState(null, '', window.location.href.split('#')[0]);
        } catch {
          window.location.hash = '';
        }
      }
      await renderCurrentRoute();
    }
  }

  async function renderCurrentRoute() {
    const root = document.getElementById('codelabs-app');
    if (!root) return;

    if (activeCleanup) {
      activeCleanup();
      activeCleanup = null;
    }

    const slug = resolveRouteSlug();

    if (!slug) {
      renderLoading(root, 'Cargando catálogo de Codelabs...');
      try {
        const codelabs = await ns.loader.loadCodelabCatalog();
        updateDocumentMeta(
          'Codelabs Paso a Paso | Maureen Barahona · MauDev',
          'Talleres técnicos interactivos paso a paso sobre Cloud, IA, Desarrollo Agéntico y HealthTech por Maureen Barahona (GDE Cloud & WTM Ambassador).'
        );
        ns.CodelabList.renderCodelabList({
          container: root,
          codelabs,
          onNavigateCodelab: (targetId) => {
            void navigateTo(targetId);
          },
          onToggleTheme: toggleTheme,
          getTheme,
        });
        window.scrollTo({ top: 0, behavior: 'auto' });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Error inesperado al cargar los codelabs.';
        renderError(root, msg, () => {
          void navigateTo(null, { replace: true });
        });
      }
      return;
    }

    renderLoading(root, 'Preparando entorno del Codelab...');
    try {
      const codelab = await ns.loader.loadCodelabBySlug(slug);
      updateDocumentMeta(
        `${codelab.metadata.title} | Codelabs · Maureen Barahona`,
        codelab.metadata.summary
      );
      activeCleanup = ns.CodelabReader.renderCodelabReader({
        container: root,
        codelab,
        onBackToIndex: () => {
          void navigateTo(null);
        },
        onToggleTheme: toggleTheme,
        getTheme,
      });
      window.scrollTo({ top: 0, behavior: 'auto' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : `No se encontró el codelab "${slug}".`;
      renderError(root, msg, () => {
        void navigateTo(null);
      });
    }
  }

  applyTheme(getTheme());

  window.addEventListener('popstate', () => {
    void renderCurrentRoute();
  });

  window.addEventListener('hashchange', () => {
    void renderCurrentRoute();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      void renderCurrentRoute();
    });
  } else {
    void renderCurrentRoute();
  }
})();
