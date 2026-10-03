/*
 * imagePolicy.js — economics + quality contract for the Future-Image feature (founder §4A).
 *
 * Usage limits are built in from day one so a paid provider can never be called without bound. NO
 * provider dollar costs are hard-coded in the UI — only these product-policy constants.
 */

// Free tier: one trial generation, ever.
export const FREE_IMAGE_TRIALS = 1;
// Pro tier: monthly included generations (configurable; product default 8).
export const PRO_MONTHLY_IMAGE_LIMIT = 8;

// Quality tiers — preview is cheap/low, the final is medium. (Provider maps these to its own params.)
export const IMAGE_PREVIEW_QUALITY = 'LOW';
export const IMAGE_FINAL_QUALITY = 'MEDIUM';

// Provider generation states — the product state machine the UI renders.
export const IMAGE_STATES = ['not_configured', 'generating', 'ready', 'failed'];

// No image provider / API key is wired yet. The UI shows an honest not-connected message, never a
// fabricated image. This milestone does NOT silently wire a paid API (founder: decision required).
export const IMAGE_PROVIDER_STATE = 'NOT_CONFIGURED';
