/**
 * Test suite for linkExtractor.js
 *
 * Run with: node tests/linkExtractor.test.js
 *
 * Covers:
 *  1. Protocol URLs (http, https, ftp)
 *  2. mailto links
 *  3. Bare domains (with and without www)
 *  4. Deduplication (exact + trailing slash + protocol variants)
 *  5. Sorting
 *  6. Edge cases (empty input, no links, punctuation, etc.)
 */

import { extractLinks } from '../src/lib/linkExtractor.js';

let passed = 0;
let failed = 0;

function assert(description, condition) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${description}`);
  }
}

function assertDeepEqual(description, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed++;
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${description}`);
    console.error(`     expected: ${JSON.stringify(expected)}`);
    console.error(`     actual:   ${JSON.stringify(actual)}`);
  }
}

// ── Test groups ──────────────────────────────────────────────

console.log('\n📋 HTTP/HTTPS URLs');
{
  const r = extractLinks('Visita https://example.com per maggiori info');
  assertDeepEqual('estrai https', r, ['https://example.com']);
}
{
  const r = extractLinks('Vedi http://sito.org/pagina e https://altro.it');
  assertDeepEqual('estrai http e https misti', r, ['http://sito.org/pagina', 'https://altro.it']);
}
{
  const r = extractLinks('test https://sub.domain.co.uk/path?a=1&b=2#frag');
  assertDeepEqual('url complesso con query e fragment', r, ['https://sub.domain.co.uk/path?a=1&b=2#frag']);
}

console.log('\n📋 FTP URLs');
{
  const r = extractLinks('Scarica da ftp://files.example.org/archivio.zip');
  assertDeepEqual('estrai ftp', r, ['ftp://files.example.org/archivio.zip']);
}

console.log('\n📋 mailto links');
{
  const r = extractLinks('Contatta info@example.com oppure mailto:help@example.com');
  // info@example.com is not a bare domain, and our bare-domain regex shouldn't match it
  // mailto:help@example.com should be matched
  const hasMailto = r.some(l => l === 'mailto:help@example.com');
  assert('estrai mailto esplicito', hasMailto);
}
{
  const r = extractLinks('Scrivi a mailto:test@dominio.com per assistenza');
  assertDeepEqual('mailto singolo', r, ['mailto:test@dominio.com']);
}

console.log('\n📋 Bare domains');
{
  const r = extractLinks('Vai su example.com per vedere');
  assertDeepEqual('dominio semplice .com', r, ['example.com']);
}
{
  const r = extractLinks('Visita www.miosito.it e anche blog.example.org');
  assertDeepEqual('www + sottodominio', r, ['blog.example.org', 'www.miosito.it']);
}
{
  const r = extractLinks('Prova test.io/prodotti e shop.online/offerte');
  assert('dominio con path', r.includes('test.io/prodotti') && r.includes('shop.online/offerte'));
}
{
  const r = extractLinks('Nuovi gTLD: sito.dev, azienda.tech, blog.news');
  assert('nuovi gTLD', r.length === 3);
}

console.log('\n📋 Deduplica — duplicati esatti');
{
  const r = extractLinks('https://example.com e poi ancora https://example.com');
  assertDeepEqual('stesso URL due volte', r, ['https://example.com']);
}

console.log('\n📋 Deduplica — trailing slash');
{
  const r = extractLinks('https://example.com/ e https://example.com');
  // La prima occorrenza (con slash) viene conservata; il duplicato senza slash viene scartato
  assertDeepEqual('con e senza trailing slash', r, ['https://example.com/']);
  assert('risultato unico', r.length === 1);
}
{
  const r = extractLinks('https://example.com/path/ e https://example.com/path');
  assertDeepEqual('path con e senza trailing slash', r, ['https://example.com/path/']);
  assert('risultato unico', r.length === 1);
}
{
  // Invertiamo l'ordine: prima senza slash, poi con slash
  const r = extractLinks('https://example.com e https://example.com/');
  assertDeepEqual('ordine inverso — mantiene la prima occorrenza senza slash', r, ['https://example.com']);
  assert('risultato unico', r.length === 1);
}

console.log('\n📋 Deduplica — http vs https');
{
  const r = extractLinks('http://example.com e https://example.com');
  assert('http e https stesso dominio → deduplicati', r.length === 1);
}

console.log('\n📋 Deduplica — www vs non-www bare domains');
{
  const r = extractLinks('www.example.com e example.com');
  // These are distinct strings, and the normalise function only handles protocol + trailing slash
  // www.example.com and example.com are technically different domains, so they should both appear
  // This is a design decision: we treat them as separate links
  assert('www e non-www sono link distinti (scelta di design)', r.length === 2);
}

console.log('\n📋 Ordinamento');
{
  const r = extractLinks('https://zeta.com https://alfa.org https://beta.it');
  assertDeepEqual('ordinamento alfabetico', r, ['https://alfa.org', 'https://beta.it', 'https://zeta.com']);
}
{
  const r = extractLinks('https://BETA.com https://alfa.org');
  assertDeepEqual('case-insensitive', r, ['https://alfa.org', 'https://BETA.com']);
}

console.log('\n📋 Edge cases');
{
  const r = extractLinks('');
  assertDeepEqual('input vuoto', r, []);
}
{
  const r = extractLinks(null);
  assertDeepEqual('input null', r, []);
}
{
  const r = extractLinks('Nessun link qui, solo testo normale.');
  assertDeepEqual('nessun link', r, []);
}
{
  const r = extractLinks('https://example.com).  Fine frase con parentesi.');
  assert('parentesi di chiusura rimossa', r.includes('https://example.com') && !r[0].endsWith(')'));
}
{
  const r = extractLinks('https://example.com, e poi testo.');
  assert('virgola finale rimossa', !r[0].endsWith(','));
}
{
  const r = extractLinks('Contatta info@example.com');
  // email senza mailto: non dovrebbe essere catturata come link
  // a meno che non venga riconosciuta come dominio (example.com lo è)
  // Dovremmo ottenere example.com ma non info@example.com
  assert('email semplice non catturata come mailto', !r.some(l => l.includes('@')));
}

console.log('\n📋 Test complesso — testo misto');
{
  const input = `
    Ciao! Dai un'occhiata a questi link:
    https://github.com/project
    http://oldsite.org/archive/
    https://github.com/project/
    ftp://download.server.it/file.zip
    www.newsblog.com/articolo
    example.com
    Visita anche https://news.ycombinator.com e mailto:admin@test.it
  `;
  const r = extractLinks(input);

  // Should have extracted and deduplicated
  assert('contiene github', r.some(l => l.includes('github.com')));
  assert('contiene oldsite', r.some(l => l.includes('oldsite.org')));
  assert('github deduplicato (trailing slash)', r.filter(l => l.includes('github.com')).length === 1);
  assert('contiene ftp', r.some(l => l.startsWith('ftp://')));
  assert('contiene mailto', r.some(l => l.startsWith('mailto:')));
  assert('contiene newsblog', r.some(l => l.includes('newsblog.com')));
  assert('contiene example.com', r.some(l => l.includes('example.com')));
  assert('contiene hackernews', r.some(l => l.includes('ycombinator.com')));
  assert('nessun duplicato', new Set(r).size === r.length);
  assert('ordinato', r.every((v, i, a) => !i || v.toLowerCase() >= a[i - 1].toLowerCase()));
}

// ── Summary ──────────────────────────────────────────────────

console.log(`\n${'═'.repeat(50)}`);
console.log(`  ${passed} passed, ${failed} failed  (${passed + failed} total)`);
console.log(`${'═'.repeat(50)}\n`);

process.exit(failed > 0 ? 1 : 0);
