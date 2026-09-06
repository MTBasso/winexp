/**
 * The Axes and Descriptors settled by ticket 07.
 *
 * Phrased for someone who cannot tell Malbec from Merlot: no "taninos", no
 * "acidez", no "final de boca". Every Axis is a question a person could answer
 * about a glass of anything.
 */
import type { Axis } from "../domain/types";

export const AXES: readonly Axis[] = [
  { id: "gostei", question: "O quanto você gostou?", low: "Nem um pouco", high: "Muito" },
  { id: "corpo", question: "Como ele parece na boca?", low: "Leve, fácil", high: "Encorpado, forte" },
  { id: "doce", question: "Puxa mais para onde?", low: "Seco", high: "Doce" },
  { id: "denovo", question: "Pediria outra taça?", low: "Não", high: "Com certeza" },
];

/** Tapped rather than typed — this is what makes a Carousel look considered. */
export const DESCRIPTORS: readonly string[] = [
  "frutas vermelhas", "frutas escuras", "cítrico", "floral",
  "baunilha", "madeira", "chocolate", "especiarias",
  "terroso", "herbal", "mel", "tostado",
];

export const MAX_DESCRIPTORS = 3;
