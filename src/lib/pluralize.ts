/**
 * Returns the plural form of a word based on the count.
 * Simple English pluralization: adds 's' for plural, keeps singular for count of 1.
 *
 * @param word - The word to pluralize
 * @param count - The count to determine if plural is needed
 * @returns The singular word if count is 1, otherwise the plural form (word + 's')
 *
 * @example
 * pluralize("error", 1) // "error"
 * pluralize("error", 2) // "errors"
 * pluralize("warning", 0) // "warnings"
 */
export function pluralize(word: string, count: number): string {
  return count === 1 ? word : `${word}s`;
}
