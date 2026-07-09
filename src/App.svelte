<script>
  import { extractLinks } from './lib/linkExtractor.js';

  /** @type {string} */
  let inputText = $state('');
  /** @type {string[]} */
  let links = $state([]);
  /** @type {string|null} */
  let copiedId = $state(null);
  /** @type {boolean} */
  let allCopied = $state(false);
  /** @type {string|null} */
  let error = $state(null);

  let copyTimeout = null;

  const hasLinks = $derived(links.length > 0);
  const linkCount = $derived(links.length);
  const isEmpty = $derived(inputText.trim().length === 0);

  function handleExtract() {
    error = null;
    if (isEmpty) {
      error = 'Incolla del testo contenente link prima di estrarre.';
      return;
    }
    const result = extractLinks(inputText);
    if (result.length === 0) {
      error = 'Nessun link trovato nel testo. Prova con un testo che contenga URL.';
    }
    links = result;
  }

  async function copyLink(link, id) {
    try {
      await navigator.clipboard.writeText(link);
      copiedId = id;
      if (copyTimeout) clearTimeout(copyTimeout);
      copyTimeout = setTimeout(() => { copiedId = null; }, 1800);
    } catch {
      // Fallback for older browsers / non-HTTPS contexts
      const ta = document.createElement('textarea');
      ta.value = link;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      copiedId = id;
      if (copyTimeout) clearTimeout(copyTimeout);
      copyTimeout = setTimeout(() => { copiedId = null; }, 1800);
    }
  }

  async function copyAll() {
    const text = links.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      allCopied = true;
      setTimeout(() => { allCopied = false; }, 2200);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      allCopied = true;
      setTimeout(() => { allCopied = false; }, 2200);
    }
  }

  function handleKeydown(e) {
    // Ctrl+Enter / Cmd+Enter to extract
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExtract();
    }
  }

  function handleClear() {
    inputText = '';
    links = [];
    error = null;
  }

  function handlePaste() {
    // Clear previous results when new text is pasted
    links = [];
    error = null;
  }
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
</svelte:head>

<div class="app-shell">

  <!-- Header -->
  <header class="header">
    <div class="header-inner">
      <div class="logo-area">
        <!-- Chain-link logo SVG -->
        <svg class="logo-icon" width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2.5" fill="none" />
          <circle cx="24" cy="24" r="5" stroke="currentColor" stroke-width="2.5" fill="none" />
          <path d="M16 16L20 20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
          <path d="M8 10C6.5 8.5 6.5 6 8 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.3" />
          <path d="M28 31.5C29.5 30 29.5 27.5 28 26" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.3" />
        </svg>
        <div class="logo-text">
          <span class="eyebrow">Estrai • Deduplica • Copia</span>
          <h1 class="title">LinkCleaner</h1>
        </div>
      </div>
      <p class="subtitle">Incolla qualsiasi testo contenente URL — messaggi, documenti, pagine web — e ottieni subito una lista pulita di link unici, pronti da copiare.</p>
    </div>
  </header>

  <!-- Main -->
  <main class="main">
    <!-- Input section -->
    <section class="input-section" aria-label="Area di input">
      <div class="input-wrapper">
        <label for="link-input" class="input-label">Testo da analizzare</label>
        <textarea
          id="link-input"
          class="input-field"
          bind:value={inputText}
          onpaste={handlePaste}
          onkeydown={handleKeydown}
          placeholder="Incolla qui il testo che contiene link…&#10;&#10;Esempio: &#34;Ciao, dai un'occhiata a https://example.com/articolo e anche www.altro-sito.org&#34;"
          rows="8"
          spellcheck="false"
        ></textarea>
        <div class="input-actions">
          <span class="char-count" aria-live="polite">{inputText.length} caratteri</span>
          <div class="input-buttons">
            {#if inputText.length > 0}
              <button class="btn btn-ghost" onclick={handleClear} type="button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                Pulisci
              </button>
            {/if}
            <button class="btn btn-primary" onclick={handleExtract} disabled={isEmpty} type="button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
              Estrai link
            </button>
          </div>
        </div>
      </div>

      {#if error}
        <div class="error-banner" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>{error}</span>
        </div>
      {/if}
    </section>

    <!-- Results section -->
    <section class="results-section" aria-label="Link estratti" aria-live="polite">
      {#if hasLinks}
        <div class="results-header">
          <div class="results-count">
            <span class="count-number">{linkCount}</span>
            <span class="count-label">{linkCount === 1 ? 'link trovato' : 'link trovati'}</span>
          </div>
          <button class="btn btn-secondary" onclick={copyAll} type="button">
            {#if allCopied}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              Copiati tutti!
            {:else}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copia tutti
            {/if}
          </button>
        </div>

        <ol class="link-list">
          {#each links as link, i (link)}
            <li class="link-item">
              <span class="link-index" aria-hidden="true">{i + 1}</span>
              <a class="link-url" href={link.startsWith('mailto:') ? link : link.startsWith('http') || link.startsWith('ftp') ? link : 'https://' + link} target="_blank" rel="noopener noreferrer" title="Apri link in una nuova scheda">
                <span class="link-protocol" aria-hidden="true">
                  {#if link.startsWith('https://')}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  {:else if link.startsWith('http://')}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                  {:else if link.startsWith('ftp://')}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  {:else if link.startsWith('mailto:')}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  {:else}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  {/if}
                </span>
                <code class="link-text">{link}</code>
              </a>
              <button
                class="btn btn-copy"
                onclick={() => copyLink(link, link)}
                aria-label={copiedId === link ? 'Copiato!' : 'Copia link'}
                title={copiedId === link ? 'Copiato!' : 'Copia link'}
                type="button"
              >
                {#if copiedId === link}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                  <span class="copy-label">Copiato</span>
                {:else}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  <span class="copy-label">Copia</span>
                {/if}
              </button>
            </li>
          {/each}
        </ol>
      {/if}

      {#if !hasLinks && !error && inputText.length === 0}
        <div class="empty-state">
          <svg class="empty-icon" width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <circle cx="22" cy="22" r="7" stroke="currentColor" stroke-width="2" opacity="0.3" />
            <circle cx="42" cy="42" r="7" stroke="currentColor" stroke-width="2" opacity="0.3" />
            <path d="M29 29L35 35" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.2" />
            <circle cx="16" cy="16" r="2.5" fill="currentColor" opacity="0.15" />
            <circle cx="48" cy="48" r="2.5" fill="currentColor" opacity="0.15" />
            <circle cx="40" cy="18" r="2" fill="currentColor" opacity="0.1" />
            <circle cx="22" cy="44" r="2" fill="currentColor" opacity="0.1" />
            <line x1="19" y1="19" x2="27" y2="27" stroke="currentColor" stroke-width="1.5" opacity="0.12" />
            <line x1="37" y1="37" x2="45" y2="45" stroke="currentColor" stroke-width="1.5" opacity="0.12" />
          </svg>
          <p class="empty-text">Incolla un testo con link nell'area sopra e premi <strong>Estrai link</strong> per vederli apparire qui.</p>
        </div>
      {/if}
    </section>
  </main>

  <!-- Footer -->
  <footer class="footer">
    <p>LinkCleaner — estrazione locale, nessun dato viene inviato a server esterni.</p>
  </footer>
</div>

<style>
  /* =============================================
     CSS Custom Properties (Design Tokens)
     ============================================= */
  :global(:root) {
    --color-bg:        #f8f6f2;
    --color-surface:   #ffffff;
    --color-primary:   #1a56db;
    --color-primary-hover: #1e40af;
    --color-primary-light: #dbeafe;
    --color-primary-subtle: #eff6ff;
    --color-success:   #059669;
    --color-success-light: #d1fae5;
    --color-error:     #dc2626;
    --color-error-light: #fef2f2;
    --color-text:      #0f172a;
    --color-text-muted:#475569;
    --color-text-soft: #64748b;
    --color-border:    #e2e8f0;
    --color-border-light: #f1f5f9;
    --color-focus:     #1a56db;

    --font-display:    'Outfit', system-ui, -apple-system, sans-serif;
    --font-body:       system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-mono:       'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;

    --radius-sm:       6px;
    --radius-md:       10px;
    --radius-lg:       14px;

    --space-xs:        4px;
    --space-sm:        8px;
    --space-md:        16px;
    --space-lg:        24px;
    --space-xl:        32px;
    --space-2xl:       48px;

    --shadow-sm:       0 1px 2px rgba(0,0,0,0.04);
    --shadow-md:       0 2px 8px rgba(0,0,0,0.06);
    --shadow-focus:    0 0 0 3px rgba(26, 86, 219, 0.25);
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  /* =============================================
     Reset & Base
     ============================================= */
  :global(*), :global(*::before), :global(*::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(html) {
    font-size: 100%;
    -webkit-text-size-adjust: 100%;
  }

  :global(body) {
    font-family: var(--font-body);
    font-size: 1rem;
    line-height: 1.6;
    color: var(--color-text);
    background: var(--color-bg);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  :global(:focus-visible) {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
    border-radius: 2px;
  }

  :global(::selection) {
    background: var(--color-primary-light);
    color: var(--color-text);
  }

  /* =============================================
     App Shell
     ============================================= */
  .app-shell {
    max-width: 760px;
    margin: 0 auto;
    padding: var(--space-lg) var(--space-md) var(--space-2xl);
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }

  /* =============================================
     Header
     ============================================= */
  .header {
    padding-bottom: var(--space-lg);
    border-bottom: 1px solid var(--color-border-light);
    margin-bottom: var(--space-lg);
  }

  .header-inner {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .logo-area {
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }

  .logo-icon {
    color: var(--color-primary);
    flex-shrink: 0;
  }

  .logo-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .eyebrow {
    font-family: var(--font-display);
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--color-text-muted);
  }

  .title {
    font-family: var(--font-display);
    font-size: 1.625rem;
    font-weight: 700;
    line-height: 1.2;
    color: var(--color-text);
    letter-spacing: -0.02em;
  }

  .subtitle {
    font-size: 0.9375rem;
    color: var(--color-text-muted);
    line-height: 1.55;
    max-width: 56ch;
  }

  /* =============================================
     Main
     ============================================= */
  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  /* =============================================
     Input Section
     ============================================= */
  .input-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .input-wrapper {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    box-shadow: var(--shadow-sm);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .input-wrapper:focus-within {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-focus);
  }

  .input-label {
    display: block;
    font-family: var(--font-display);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: var(--space-sm);
  }

  .input-field {
    width: 100%;
    min-height: 160px;
    padding: 12px 14px;
    font-family: var(--font-mono);
    font-size: 0.875rem;
    line-height: 1.65;
    color: var(--color-text);
    background: var(--color-bg);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-sm);
    resize: vertical;
    transition: border-color 0.15s ease;
  }

  .input-field::placeholder {
    color: var(--color-text-soft);
    font-family: var(--font-body);
  }

  .input-field:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .input-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: var(--space-sm);
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .char-count {
    font-size: 0.75rem;
    color: var(--color-text-soft);
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }

  .input-buttons {
    display: flex;
    gap: var(--space-sm);
    align-items: center;
  }

  /* =============================================
     Buttons
     ============================================= */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    font-family: var(--font-display);
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
    white-space: nowrap;
    min-height: 44px;
    min-width: 44px;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .btn:active {
    transform: scale(0.97);
  }

  .btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--color-primary);
    color: #ffffff;
    border-color: var(--color-primary);
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
  }

  .btn-secondary {
    background: var(--color-surface);
    color: var(--color-text);
    border-color: var(--color-border);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--color-primary-subtle);
    border-color: var(--color-primary);
  }

  .btn-ghost {
    background: transparent;
    color: var(--color-text-muted);
    border-color: transparent;
  }

  .btn-ghost:hover:not(:disabled) {
    color: var(--color-text);
    background: var(--color-border-light);
  }

  .btn-copy {
    background: transparent;
    color: var(--color-text-soft);
    border-color: transparent;
    padding: 8px 10px;
    flex-shrink: 0;
  }

  .btn-copy:hover {
    color: var(--color-primary);
    background: var(--color-primary-subtle);
  }

  .btn-copy .copy-label {
    font-size: 0.75rem;
    font-family: var(--font-body);
  }

  /* =============================================
     Error Banner
     ============================================= */
  .error-banner {
    display: flex;
    align-items: flex-start;
    gap: var(--space-sm);
    padding: 12px 14px;
    background: var(--color-error-light);
    border: 1px solid #fecaca;
    border-radius: var(--radius-sm);
    color: var(--color-error);
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .error-banner svg {
    flex-shrink: 0;
    margin-top: 1px;
  }

  /* =============================================
     Results Section
     ============================================= */
  .results-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .results-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
  }

  .results-count {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .count-number {
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-primary);
    font-variant-numeric: tabular-nums;
  }

  .count-label {
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }

  /* =============================================
     Link List
     ============================================= */
  .link-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 1px;
    background: var(--color-border);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .link-item {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: 6px var(--space-sm);
    background: var(--color-surface);
    transition: background-color 0.12s ease;
    min-height: 48px;
  }

  .link-item:hover {
    background: var(--color-primary-subtle);
  }

  .link-index {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 500;
    color: var(--color-text-soft);
    min-width: 24px;
    text-align: right;
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
  }

  .link-url {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    text-decoration: none;
    color: var(--color-primary);
    padding: 4px 0;
    overflow: hidden;
  }

  .link-url:hover .link-text {
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .link-url:focus-visible {
    outline-offset: -2px;
    border-radius: 3px;
  }

  .link-protocol {
    flex-shrink: 0;
    color: var(--color-text-soft);
    display: flex;
    align-items: center;
  }

  .link-text {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    line-height: 1.5;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--color-text);
  }

  /* =============================================
     Empty State
     ============================================= */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: var(--space-xl) var(--space-md);
    gap: var(--space-md);
  }

  .empty-icon {
    color: var(--color-text-muted);
    opacity: 0.5;
  }

  .empty-text {
    font-size: 0.9375rem;
    color: var(--color-text-muted);
    max-width: 42ch;
    line-height: 1.55;
  }

  /* =============================================
     Footer
     ============================================= */
  .footer {
    margin-top: auto;
    padding-top: var(--space-xl);
    text-align: center;
  }

  .footer p {
    font-size: 0.75rem;
    color: var(--color-text-soft);
  }

  /* =============================================
     Responsive
     ============================================= */
  @media (max-width: 480px) {
    .app-shell {
      padding: var(--space-md) var(--space-sm) var(--space-xl);
    }

    .title {
      font-size: 1.375rem;
    }

    .subtitle {
      font-size: 0.8125rem;
    }

    .input-field {
      font-size: 0.8125rem;
      min-height: 140px;
    }

    .link-text {
      font-size: 0.75rem;
    }

    .btn {
      font-size: 0.8125rem;
      padding: 10px 14px;
    }

    .input-actions {
      flex-direction: column;
      align-items: flex-start;
    }

    .input-buttons {
      width: 100%;
      justify-content: flex-end;
    }
  }

  @media (min-width: 768px) {
    .app-shell {
      padding: var(--space-xl) var(--space-lg) var(--space-2xl);
    }

    .title {
      font-size: 1.875rem;
    }

    .link-item {
      padding: 8px var(--space-md);
    }
  }
</style>
