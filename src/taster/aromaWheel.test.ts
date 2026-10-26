import { describe, expect, it } from "vitest";
import {
  AROMA_CATEGORIES, dimmedCategoryIds, TIPO_EXCLUDED_CATEGORIES, visibleCategoriesForTipo,
} from "./aromaWheel";

describe("visibleCategoriesForTipo", () => {
  it("excludes exactly the categories mapped for each Tipo", () => {
    for (const [tipo, excluded] of Object.entries(TIPO_EXCLUDED_CATEGORIES)) {
      const visible = visibleCategoriesForTipo(tipo as keyof typeof TIPO_EXCLUDED_CATEGORIES);
      for (const id of excluded) {
        expect(visible.some((c) => c.id === id)).toBe(false);
      }
      const expectedCount = AROMA_CATEGORIES.length - excluded.length;
      expect(visible).toHaveLength(expectedCount);
    }
  });

  it("a Tinto Pour never shows citrus or leveduras zones", () => {
    const visible = visibleCategoriesForTipo("Tinto");
    expect(visible.some((c) => c.id === "citricos")).toBe(false);
    expect(visible.some((c) => c.id === "leveduras")).toBe(false);
  });

  it("Outro excludes nothing", () => {
    expect(visibleCategoriesForTipo("Outro")).toHaveLength(AROMA_CATEGORIES.length);
  });
});

describe("dimmedCategoryIds", () => {
  it("is empty when nothing is selected", () => {
    expect(dimmedCategoryIds([])).toEqual(new Set());
  });

  it("dims every FAULT category when a FRESH term is selected", () => {
    const dimmed = dimmedCategoryIds(["morango"]); // bagas_vermelhas (FRESH)
    for (const id of ["mofo", "defeito", "oxidado", "sulfuroso", "bretado"]) {
      expect(dimmed.has(id)).toBe(true);
    }
  });

  it("dims every FRESH category when a FAULT term is selected (mutual)", () => {
    const dimmed = dimmedCategoryIds(["mofo"]); // mofo (FAULT)
    for (const id of ["frutos_arvore", "frutos_tropicais", "bagas_vermelhas", "citricos", "floral", "vegetal"]) {
      expect(dimmed.has(id)).toBe(true);
    }
  });

  it("never dims a DEVELOPED category, and a DEVELOPED term dims nothing", () => {
    const dimmed = dimmedCategoryIds(["morango", "mofo"]);
    for (const id of ["ervas_secas", "leveduras", "especiarias", "madeira", "animal"]) {
      expect(dimmed.has(id)).toBe(false);
    }
    expect(dimmedCategoryIds(["pão"])).toEqual(new Set()); // leveduras (DEVELOPED)
  });

  it("clears once the triggering term is deselected", () => {
    const withTerm = dimmedCategoryIds(["morango"]);
    expect(withTerm.size).toBeGreaterThan(0);
    const withoutTerm = dimmedCategoryIds([]);
    expect(withoutTerm.size).toBe(0);
  });
});
