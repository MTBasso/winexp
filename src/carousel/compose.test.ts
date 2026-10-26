import { describe, expect, it } from "vitest";
import type { Impression } from "../domain/types";
import { composeCarousel, MAX_FILES, slideCount } from "./compose";

const impressions = (n: number): Impression[] =>
  Array.from({ length: n }, (_, i) => ({
    pourId: `p${i + 1}`,
    ratings: { denovo: "high" as const },
    descriptors: [],
    note: `nota ${i + 1}`,
    achei: "bom" as const,
    pour: {
      name: `Vinho ${i + 1}`, producer: "", vintage: "", grape: "", country: "",
      tipo: "Outro" as const, imageUrl: null,
    },
  }));

describe("composeCarousel", () => {
  it("produces nothing when nothing was rated", () => {
    const c = composeCarousel([]);
    expect(slideCount(c)).toBe(0);
    expect(c.includeCover).toBe(false);
  });

  it("includes the cover for a normal evening", () => {
    const c = composeCarousel(impressions(4));
    expect(c.includeCover).toBe(true);
    expect(slideCount(c)).toBe(5);
    expect(c.truncated).toBe(false);
  });

  it("keeps the cover at exactly nine rated Pours — the last case that fits", () => {
    const c = composeCarousel(impressions(9));
    expect(c.includeCover).toBe(true);
    expect(slideCount(c)).toBe(MAX_FILES);
  });

  it("drops the cover rather than a wine at ten", () => {
    const c = composeCarousel(impressions(10));
    expect(c.includeCover).toBe(false);
    expect(c.impressions).toHaveLength(10);
    expect(slideCount(c)).toBe(MAX_FILES);
    expect(c.truncated).toBe(false);
  });

  it("truncates to the first ten in Lineup order past that", () => {
    const c = composeCarousel(impressions(14));
    expect(c.includeCover).toBe(false);
    expect(slideCount(c)).toBe(MAX_FILES);
    expect(c.truncated).toBe(true);
    expect(c.impressions[0]?.note).toBe("nota 1");
    expect(c.impressions[9]?.note).toBe("nota 10");
  });

  it("never exceeds the Chromium cap, whatever it is given", () => {
    for (const n of [1, 8, 9, 10, 11, 25, 100]) {
      expect(slideCount(composeCarousel(impressions(n)))).toBeLessThanOrEqual(MAX_FILES);
    }
  });

  it("preserves the order it was given", () => {
    const c = composeCarousel(impressions(3));
    expect(c.impressions.map((i) => i.note)).toEqual(["nota 1", "nota 2", "nota 3"]);
  });
});
