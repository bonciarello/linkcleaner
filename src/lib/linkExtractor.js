/**
 * LinkCleaner — URL extraction and deduplication engine.
 *
 * Extracts URLs from arbitrary text: protocol-based (http, https, ftp),
 * mailto links, and bare domains (example.com, www.example.com).
 * Deduplicates by normalising trailing slashes and protocol differences.
 */

/**
 * Known TLDs to validate bare-domain matches and reduce false positives.
 * Covers the most common generic, country-code, and newer gTLDs.
 */
const KNOWN_TLDS = new Set([
  'com', 'org', 'net', 'io', 'co', 'it', 'uk', 'de', 'fr', 'es', 'app',
  'dev', 'info', 'biz', 'edu', 'gov', 'mil', 'int', 'eu', 'me', 'tv',
  'ai', 'gg', 'xyz', 'online', 'site', 'tech', 'blog', 'shop', 'news',
  'media', 'agency', 'design', 'software', 'cloud', 'ink', 'wiki', 'pro',
  'us', 'ca', 'au', 'nz', 'jp', 'br', 'mx', 'nl', 'be', 'ch', 'at', 'se',
  'no', 'dk', 'fi', 'pl', 'ru', 'cn', 'kr', 'pt', 'ie', 'ar', 'cl',
]);

/** Matches URLs with an explicit protocol: http, https, ftp */
const PROTOCOL_RE = /(?:(?:https?|ftp):\/\/)[^\s<>"'`[\](){}]+/gi;

/** Matches mailto: links */
const MAILTO_RE = /mailto:[^\s<>"'`[\](){}]+/gi;

/**
 * Matches bare domains — no protocol, just a hostname that looks like a domain.
 * Must contain at least one dot and a plausible TLD (validated post-match).
 */
const BARE_DOMAIN_RE = /(?<![/\w.@-])(?:www\.)?[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(?:\/[^\s<>"'`[\](){}]*)?/gi;

/**
 * Validate a bare-domain match: must have a recognised TLD or look like a
 * valid 2–6 char alphabetic TLD, and not be a pure file extension.
 */
function isValidBareDomain(candidate) {
  const parts = candidate.split('.');
  if (parts.length < 2) return false;
  const tld = parts[parts.length - 1].toLowerCase().replace(/\/.*$/, '');
  // Strip any path from the TLD portion
  const cleanTld = tld.split('/')[0];
  if (KNOWN_TLDS.has(cleanTld)) return true;
  // Fallback: 2–6 letter TLD that looks plausible
  if (/^[a-z]{2,6}$/.test(cleanTld)) return true;
  return false;
}

/**
 * Clean trailing punctuation that is unlikely to be part of the URL.
 */
function cleanTrailingPunctuation(url) {
  return url.replace(/[.,;:!?)>]+$/, '');
}

/**
 * Normalise a URL for deduplication comparison:
 * - Remove trailing slash (unless it's the root path "/")
 * - Normalise http ↔ https to https
 * - Lowercase the result
 */
function normalise(url) {
  return url
    .replace(/^https?:\/\//i, 'https://')
    .replace(/([^:/])\/+$/m, '$1')
    .toLowerCase();
}

/**
 * Extract and deduplicate links from arbitrary text.
 *
 * @param {string} text — the raw pasted text
 * @returns {string[]} — sorted, deduplicated, cleaned URLs
 */
export function extractLinks(text) {
  if (!text || typeof text !== 'string') return [];

  // 1. Extract protocol URLs
  const protocolLinks = (text.match(PROTOCOL_RE) || []).map(cleanTrailingPunctuation);

  // 2. Extract mailto links
  const mailtoLinks = (text.match(MAILTO_RE) || []).map(cleanTrailingPunctuation);

  // 3. Extract bare domains, then filter
  const allProtocolLower = protocolLinks.map(l => l.toLowerCase());
  const bareCandidates = (text.match(BARE_DOMAIN_RE) || [])
    .map(cleanTrailingPunctuation)
    .filter(candidate => {
      // Exclude if already captured inside a protocol link
      const candidateLower = candidate.toLowerCase();
      if (allProtocolLower.some(pl => pl.includes(candidateLower))) return false;
      // Validate TLD
      return isValidBareDomain(candidate);
    });

  const allLinks = [...protocolLinks, ...mailtoLinks, ...bareCandidates];

  // 4. Deduplicate
  const seen = new Set();
  const result = [];

  for (const link of allLinks) {
    const norm = normalise(link);
    if (!seen.has(norm)) {
      seen.add(norm);
      result.push(link);
    }
  }

  // 5. Sort alphabetically (case-insensitive)
  result.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  return result;
}
