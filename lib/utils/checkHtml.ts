/**
 * Checks if a string contains HTML tags
 * @param text - The string to check
 * @returns boolean - true if HTML tags are detected
 */
export const isHtml = (text: string): boolean => {
  // Quick length check (HTML usually has tags with <>)
  if (text.length < 3) return false;

  // Simple tag detection (matches <something>)
  const tagPattern = /<(\/?[a-z][a-z0-9]*\b[^>]*)>/i;

  // Common HTML entities check
  const htmlEntities = /&(?:[a-z0-9]+|#[0-9]{1,6}|#x[0-9a-f]{1,6});/i;

  // Self-closing tags (like <img />)
  const selfClosingTags = /<[a-z]+[^>]*\/>/i;

  // Comment detection (<!-- -->)
  const htmlComments = /<!--[\s\S]*?-->/;

  return (
    tagPattern.test(text) ||
    htmlEntities.test(text) ||
    selfClosingTags.test(text) ||
    htmlComments.test(text)
  );
};
