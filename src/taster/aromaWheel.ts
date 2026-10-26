/**
 * The Aroma Wheel (Roda do Aroma dos Vinhos), picked two-level: tap a
 * ring-two category to reveal its specific terms. Pure, testable data +
 * logic — no React, no DOM.
 */
import type { Tipo } from "../domain/types";

export interface AromaCategory {
  readonly id: string;
  readonly label: string;
  readonly terms: readonly string[];
}

export const AROMA_CATEGORIES: readonly AromaCategory[] = [
  { id: "frutos_arvore", label: "Frutos de árvore", terms: ["maçã verde", "maçã madura", "pêra", "pêssego", "damasco", "marmelo"] },
  { id: "frutos_tropicais", label: "Frutos tropicais", terms: ["ananás", "maracujá", "manga", "lichia", "banana"] },
  { id: "bagas_vermelhas", label: "Bagas vermelhas", terms: ["morango", "framboesa", "cereja", "amora", "ameixa", "groselha"] },
  { id: "citricos", label: "Cítricos", terms: ["limão", "laranja", "lima", "toranja"] },
  { id: "floral", label: "Floral", terms: ["rosa", "violeta", "jasmim", "flor de laranjeira", "acácia"] },
  { id: "vegetal", label: "Vegetal", terms: ["pimentão verde", "grama cortada", "tomate verde", "aspargo"] },
  { id: "ervas_secas", label: "Ervas secas", terms: ["tomilho", "alecrim seco", "feno", "chá preto"] },
  { id: "leveduras", label: "Leveduras", terms: ["pão", "brioche", "levedura", "iogurte"] },
  { id: "especiarias", label: "Especiarias", terms: ["canela", "cravo", "pimenta preta", "noz-moscada", "anis"] },
  { id: "madeira", label: "Madeira", terms: ["vanilha", "coco", "tosta", "fumaça"] },
  { id: "animal", label: "Animal", terms: ["couro", "almíscar", "caça", "estábulo"] },
  { id: "mofo", label: "Mofo", terms: ["rolha", "mofo", "papelão úmido", "porão"] },
  { id: "defeito", label: "Defeito", terms: ["acetona", "vinagre", "repolho cozido", "verniz"] },
  { id: "oxidado", label: "Oxidado", terms: ["xerez", "nozes", "maçã passada", "caramelo escuro"] },
  { id: "sulfuroso", label: "Sulfuroso", terms: ["fósforo queimado", "borracha queimada", "ovo podre"] },
  { id: "bretado", label: "Etil-fenol/Bretado", terms: ["suor de cavalo", "curativo", "couro queimado"] },
];

const FRESH = ["frutos_arvore", "frutos_tropicais", "bagas_vermelhas", "citricos", "floral", "vegetal"];
const DEVELOPED = ["ervas_secas", "leveduras", "especiarias", "madeira", "animal"];
const FAULT = ["mofo", "defeito", "oxidado", "sulfuroso", "bretado"];

const TERM_TO_CATEGORY = new Map<string, string>();
for (const category of AROMA_CATEGORIES) {
  for (const term of category.terms) TERM_TO_CATEGORY.set(term, category.id);
}

/**
 * Picking a term from a FRESH category dims every FAULT category (and vice
 * versa) — a reversible steer, never a lock. DEVELOPED dims nothing and is
 * dimmed by nothing.
 */
export function dimmedCategoryIds(selectedDescriptors: readonly string[]): ReadonlySet<string> {
  const selectedCategoryIds = new Set(
    selectedDescriptors
      .map((term) => TERM_TO_CATEGORY.get(term))
      .filter((id): id is string => id !== undefined),
  );

  const dimmed = new Set<string>();
  const anyFresh = [...selectedCategoryIds].some((id) => FRESH.includes(id));
  const anyFault = [...selectedCategoryIds].some((id) => FAULT.includes(id));

  if (anyFresh) for (const id of FAULT) dimmed.add(id);
  if (anyFault) for (const id of FRESH) dimmed.add(id);

  return dimmed;
}

/** Categories the wheel excludes entirely for a given Tipo — a Tinto Pour never shows "Vinho branco" zones. */
export const TIPO_EXCLUDED_CATEGORIES: Record<Tipo, readonly string[]> = {
  Tinto: ["citricos", "leveduras"],
  Branco: ["bagas_vermelhas", "animal", "bretado"],
  "Rosé": ["animal", "bretado"],
  Espumante: ["bagas_vermelhas", "animal", "bretado", "madeira"],
  Fortificado: ["floral", "vegetal", "citricos", "frutos_tropicais"],
  Outro: [],
};

export function visibleCategoriesForTipo(tipo: Tipo): readonly AromaCategory[] {
  const excluded = TIPO_EXCLUDED_CATEGORIES[tipo];
  return AROMA_CATEGORIES.filter((category) => !excluded.includes(category.id));
}
