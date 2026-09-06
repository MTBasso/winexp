/**
 * PROTOTYPE — throwaway. Ticket 07 content proposal.
 *
 * Axes phrased for someone who cannot tell Malbec from Merlot. No wine-school
 * register: no "taninos", no "acidez", no "final de boca". Every axis is a
 * question a person could answer about a glass of anything.
 */

export interface Axis {
  readonly id: string;
  readonly question: string;
  readonly low: string;
  readonly high: string;
}

export const AXES: readonly Axis[] = [
  { id: "gostei", question: "O quanto você gostou?", low: "Nem um pouco", high: "Muito" },
  { id: "corpo", question: "Como ele parece na boca?", low: "Leve, fácil", high: "Encorpado, forte" },
  { id: "doce", question: "Puxa mais para onde?", low: "Seco", high: "Doce" },
  { id: "denovo", question: "Pediria outra taça?", low: "Não", high: "Com certeza" },
];

/** Tappable words, so a Taster says something specific without typing. */
export const DESCRIPTORS: readonly string[] = [
  "frutas vermelhas", "frutas escuras", "cítrico", "floral",
  "baunilha", "madeira", "chocolate", "especiarias",
  "terroso", "herbal", "mel", "tostado",
];

export const MAX_DESCRIPTORS = 3;

/** "no more than 3 lines" — clamped by grapheme, per ticket 02. */
export const NOTE_MAX_GRAPHEMES = 140;

export function countGraphemes(text: string): number {
  // Intl.Segmenter keeps emoji and accented pt-BR characters as one unit.
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter("pt-BR", { granularity: "grapheme" });
    let n = 0;
    for (const _ of seg.segment(text)) n += 1;
    return n;
  }
  return [...text].length;
}

export interface Impression {
  readonly ratings: Readonly<Record<string, number>>;
  readonly descriptors: readonly string[];
  readonly note: string;
}

export const EMPTY_IMPRESSION: Impression = { ratings: {}, descriptors: [], note: "" };

export const isStarted = (i: Impression | undefined) =>
  !!i && (Object.keys(i.ratings).length > 0 || i.descriptors.length > 0 || i.note.length > 0);
