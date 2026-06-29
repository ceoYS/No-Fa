/*
 * Locale primitive (NoF P0 i18n foundation). This module is intentionally tiny: it
 * is ONLY the persisted-locale contract, not a full i18n layer. It declares which
 * locales the app honestly supports, the default, and a normalizer that guarantees a
 * valid value on the way in (from a saved bundle, a future settings toggle, or an
 * onboarding language pick). No strings, no translation tables, no React — those
 * arrive in a later, separately-approved slice. App reads `locale` from the persisted
 * bundle through normalizeLocale() and persists it back through the same no-network
 * storage box as every other slice (src/utils/storage.js).
 *
 * ko is the product's primary language and the default: an unknown / missing / corrupt
 * stored value always resolves to ko, never to a half-supported tongue.
 */
export const SUPPORTED_LOCALES = ['ko', 'en'];

export const DEFAULT_LOCALE = 'ko';

// Resolve any candidate (saved value, toggle input, query param) to a supported
// locale. Returns the value only when it is an exact, supported match; everything
// else — null, undefined, '', a region tag like 'en-US', an unsupported language —
// falls back to DEFAULT_LOCALE. Pure and total: never throws, always returns a
// member of SUPPORTED_LOCALES.
export function normalizeLocale(value) {
  return SUPPORTED_LOCALES.includes(value) ? value : DEFAULT_LOCALE;
}
