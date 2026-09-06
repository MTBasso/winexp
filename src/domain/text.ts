/**
 * The Note is "no more than three lines". Enforced as a grapheme budget rather
 * than a line count, because lines depend on the viewport and graphemes do not.
 *
 * Counted by grapheme, never by code unit: ticket 02. "não" and an emoji are
 * each one character to the person typing them, and `String.length` disagrees.
 */
export const NOTE_MAX_GRAPHEMES = 140;

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter("pt-BR", { granularity: "grapheme" })
    : null;

export function countGraphemes(text: string): number {
  if (!segmenter) return [...text].length;
  let count = 0;
  for (const _ of segmenter.segment(text)) count += 1;
  return count;
}

/** Trims to the budget without splitting a grapheme in half. */
export function clampGraphemes(text: string, max = NOTE_MAX_GRAPHEMES): string {
  if (countGraphemes(text) <= max) return text;
  if (!segmenter) return [...text].slice(0, max).join("");
  let out = "";
  let count = 0;
  for (const { segment } of segmenter.segment(text)) {
    if (count >= max) break;
    out += segment;
    count += 1;
  }
  return out;
}
