const slugify = require('slugify');

/**
 * Generate a clean, URL-safe slug with optional random hash for collision avoidance
 * @param {string} text
 * @param {boolean} appendHash
 * @returns {string}
 */
function createSlug(text, appendHash = false) {
  const base = slugify(text, {
    lower: true,
    strict: true,
    trim: true
  });

  if (!appendHash) return base;
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${base}-${randomSuffix}`;
}

module.exports = { createSlug };
