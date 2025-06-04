
/**
 * Remove all HTML tags from a string.
 *
 * @param html - The string that contains HTML tags to be removed.
 * @returns The string with all HTML tags removed.
 */
export const stripHtml = (html: string) => {
  return html.replace(/<[^>]*>/g, "");
};
