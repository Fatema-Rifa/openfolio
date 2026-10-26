/**
 * Calculate estimated reading time in minutes based on text content
 * Assumes average reading speed of 200-250 words per minute
 * @param {string} content
 * @returns {number} reading time in minutes (minimum 1)
 */
function calculateReadingTime(content) {
  if (!content || typeof content !== 'string') return 1;
  // Strip HTML tags if any
  const cleanText = content.replace(/<[^>]*>?/gm, ' ').trim();
  const words = cleanText.split(/\s+/).filter(Boolean).length;
  const wordsPerMinute = 220;
  const minutes = Math.ceil(words / wordsPerMinute);
  return Math.max(1, minutes);
}

module.exports = { calculateReadingTime };
