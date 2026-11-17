// @ts-check
(function () {
  const ns = (window.MauCodelabs = window.MauCodelabs || {});

  const isFile = window.location.protocol === 'file:';
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '[::1]';

  // Locate `/codelabs` segment in full href (for file://) and pathname (for http/https)
  const hrefMatch = window.location.href.match(/^(.*?\/codelabs)(?:\/|$|\?|#)/i);
  const codelabsHrefBase = hrefMatch ? hrefMatch[1] : '.';
  const publicHrefBase = codelabsHrefBase.replace(/\/codelabs$/i, '');

  const pathMatch = window.location.pathname.match(/^(.*?\/codelabs)(?:\/|$)/i);
  const codelabsPathBase = pathMatch ? pathMatch[1] : '/codelabs';
  const siteRootPath = codelabsPathBase.replace(/\/codelabs$/i, '');
  const isMountedInSubfolder = Boolean(siteRootPath && siteRootPath !== '/');

  /**
   * Whether clean SPA pushState URLs (`/codelabs/:slug`) should be used.
   * Disabled on `file://` and subfolder mounts (like `/public/codelabs` in Live Server).
   * @returns {boolean}
   */
  function supportsCleanRoutes() {
    return !isFile && !isMountedInSubfolder;
  }

  /**
   * Link back to the main `maureenbarahona.foo` linkpage.
   * @returns {string}
   */
  function getHomeHref() {
    if (isFile) {
      return `${publicHrefBase}/index.html`;
    }
    if (isMountedInSubfolder) {
      return `${siteRootPath}/index.html`;
    }
    return '/';
  }

  /**
   * Link to the `/codelabs` catalog index.
   * @returns {string}
   */
  function getCatalogHref() {
    if (isFile) {
      return `${codelabsHrefBase}/index.html`;
    }
    if (isMountedInSubfolder) {
      return `${codelabsPathBase}/index.html`;
    }
    return isLocalhost ? `${codelabsPathBase}/` : codelabsPathBase;
  }

  /**
   * Link to a specific codelab by its ID/slug.
   * @param {string} slug
   * @returns {string}
   */
  function getCodelabHref(slug) {
    const encoded = encodeURIComponent(slug);
    if (isFile) {
      return `${codelabsHrefBase}/index.html#${encoded}`;
    }
    if (isMountedInSubfolder) {
      return `${codelabsPathBase}/index.html#${encoded}`;
    }
    return isLocalhost
      ? `${codelabsPathBase}/${encoded}/`
      : `${codelabsPathBase}/${encoded}`;
  }

  /**
   * Resolves a public asset path (e.g. `'img/logo.png'` or `'content/codelabs/manifest.json'`).
   * @param {string} relativeFromPublic
   * @returns {string}
   */
  function getPublicAssetHref(relativeFromPublic) {
    const clean = String(relativeFromPublic || '').replace(/^\/+/, '');
    if (isFile) {
      return `${publicHrefBase}/${clean}`;
    }
    return `${siteRootPath}/${clean}`;
  }

  ns.urls = {
    isFile,
    isLocalhost,
    isMountedInSubfolder,
    supportsCleanRoutes,
    getHomeHref,
    getCatalogHref,
    getCodelabHref,
    getPublicAssetHref,
  };
})();
