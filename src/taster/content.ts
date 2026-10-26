/**
 * The Axes and the "O que achei" scale settled by ticket 07.
 *
 * Phrased for someone who cannot tell Malbec from Merlot: no "taninos", no
 * "acidez", no "final de boca". Every Axis is a question a person could answer
 * about a glass of anything. Descriptors live in `./aromaWheel` now (the full
 * Aroma Wheel, picked two-level), not here.
 */
import type { Axis, AcheiValue } from "../domain/types";

export type { AcheiValue };

export const AXES: readonly Axis[] = [
  { id: "corpo", question: "Como ele parece na boca?", low: "Leve, fácil", high: "Encorpado, forte" },
  { id: "doce", question: "Puxa mais para onde?", low: "Seco", high: "Doce" },
  { id: "denovo", question: "Pediria outra taça?", low: "Não", high: "Com certeza" },
];

/** The 5-point scale that supersedes the old `gostei` Axis. */
export const ACHEI_SCALE: readonly { value: AcheiValue; label: string }[] = [
  { value: "excelente", label: "Excelente" },
  { value: "muito_bom", label: "Muito bom" },
  { value: "bom", label: "Bom" },
  { value: "regular", label: "Regular" },
  { value: "nao_gostei", label: "Não gostei" },
];

export const MAX_DESCRIPTORS = 5;
