// @ts-check
(function () {
  const ns = (window.MauCodelabs = window.MauCodelabs || {});

  /** @type {Map<string, any>} */
  const codelabCache = new Map();
  /** @type {any[] | null} */
  let catalogCache = null;

  /**
   * @param {string | { file: string, featured?: boolean }} entry
   */
  function normalizeManifestEntry(entry) {
    if (typeof entry === 'string') {
      const clean = entry.trim();
      const file = clean.endsWith('.md') ? clean : `${clean}.md`;
      const slug = file.replace(/\.md$/i, '');
      return { file, slug, featured: false };
    }
    const cleanFile = String(entry.file || '').trim();
    const file = cleanFile.endsWith('.md') ? cleanFile : `${cleanFile}.md`;
    const slug = file.replace(/\.md$/i, '');
    return { file, slug, featured: Boolean(entry.featured) };
  }

  /**
   * Loads and parses a codelab by slug.
   * Uses `fetch()` over HTTP/HTTPS (reading `/content/codelabs/<slug>.md`) and falls back seamlessly
   * to `window.__MAUDEV_CODELABS_FALLBACK__` when opened locally via `file://`.
   *
   * @param {string} slug
   * @param {{ featured?: boolean }} [opts]
   */
  async function loadCodelabBySlug(slug, opts = {}) {
    const cleanSlug = String(slug || '').replace(/\.md$/i, '').trim();
    if (!cleanSlug) {
      throw new Error('Identificador de codelab inválido.');
    }

    const cached = codelabCache.get(cleanSlug);
    if (cached) {
      if (opts.featured) {
        cached.metadata.featured = true;
      }
      return cached;
    }

    let markdownText = '';

    if (!ns.urls.isFile) {
      try {
        const mdUrl = ns.urls.getPublicAssetHref(
          `content/codelabs/${encodeURIComponent(cleanSlug)}.md`
        );
        const response = await fetch(mdUrl, { cache: 'no-cache' });
        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          const fetched = await response.text();
          if (!(contentType.includes('text/html') && /^\s*<!DOCTYPE html>/i.test(fetched))) {
            markdownText = fetched;
          }
        }
      } catch {
        // Fall back to embedded offline catalog if fetch is blocked
      }
    }

    if (!markdownText) {
      const fallback = /** @type {any} */ (window).__MAUDEV_CODELABS_FALLBACK__;
      const fallbackEntry = fallback && fallback.files ? fallback.files[cleanSlug] : null;
      if (typeof fallbackEntry === 'string') {
        markdownText = fallbackEntry;
      } else if (fallbackEntry && typeof fallbackEntry.value === 'string') {
        markdownText = fallbackEntry.value;
      }
    }

    if (!markdownText) {
      throw new Error(`No se encontró el codelab "${cleanSlug}".`);
    }

    const parsed = ns.parser.parseCodelabMarkdown(markdownText, {
      fallbackId: cleanSlug,
      featured: opts.featured,
    });

    codelabCache.set(cleanSlug, parsed);
    codelabCache.set(parsed.metadata.id, parsed);
    return parsed;
  }

  /**
   * Loads all published codelabs declared in `manifest.json` (with `file://` fallback).
   */
  async function loadCodelabCatalog() {
    if (catalogCache) {
      return catalogCache;
    }

    /** @type {any[] | null} */
    let rawList = null;

    if (!ns.urls.isFile) {
      try {
        const manifestUrl = ns.urls.getPublicAssetHref('content/codelabs/manifest.json');
        const response = await fetch(manifestUrl, { cache: 'no-cache' });
        if (response.ok) {
          const manifest = await response.json();
          rawList = Array.isArray(manifest)
            ? manifest
            : Array.isArray(manifest.codelabs)
            ? manifest.codelabs
            : null;
        }
      } catch {
        // Fall back to embedded manifest
      }
    }

    if (!rawList) {
      const fallback = /** @type {any} */ (window).__MAUDEV_CODELABS_FALLBACK__;
      rawList = fallback && Array.isArray(fallback.manifest) ? fallback.manifest : [];
    }

    const entries = rawList.map(normalizeManifestEntry).filter((e) => Boolean(e.slug));
    const results = await Promise.all(
      entries.map((entry) => loadCodelabBySlug(entry.slug, { featured: entry.featured }))
    );

    catalogCache = results.filter(
      (item) => item.metadata.status.toLowerCase() !== 'draft'
    );
    return catalogCache;
  }

  ns.loader = {
    loadCodelabBySlug,
    loadCodelabCatalog,
  };
})();
