import { describe, expect, it } from "vitest";
import type { Pour } from "../domain/types";
import { TASTING_VERSION } from "../domain/types";
import {
  carouselImpressions, emptyTasting, isStarted, parseTasting,
  ratedCount, storageKey, upsertImpression,
} from "./tasting";

const pour = (id: string, position: number, name = `Vinho ${position}`): Pour => ({
  id, position, name, producer: "Quinta", vintage: "2020",
  grape: "Touriga", country: "Portugal",
});

describe("storageKey", () => {
  it("scopes a Tasting to its Event, so a new degustação starts from zero", () => {
    expect(storageKey("TESTE1")).not.toBe(storageKey("TESTE2"));
  });
});

describe("parseTasting", () => {
  it("returns an empty Tasting for junk rather than throwing", () => {
    expect(parseTasting(null, "TESTE1")).toEqual(emptyTasting("TESTE1"));
    expect(parseTasting("nonsense", "TESTE1")).toEqual(emptyTasting("TESTE1"));
    expect(parseTasting(42, "TESTE1").impressions).toEqual({});
  });

  it("refuses to inherit a Tasting belonging to a different Event", () => {
    const other = {
      version: 1, eventCode: "TESTE2", firstName: "Ana",
      impressions: { p1: { ratings: { gostei: "high" }, descriptors: [], note: "oi", pour: {} } },
    };
    const parsed = parseTasting(other, "TESTE1");
    expect(parsed.impressions).toEqual({});
    expect(parsed.firstName).toBeNull();
  });

  it("MIGRATES an older version rather than discarding the evening", () => {
    const old = {
      version: 0, eventCode: "TESTE1", firstName: "Ana",
      impressions: {
        p1: { ratings: { gostei: "high" }, descriptors: ["mel"], note: "bom", pour: { name: "Brut" } },
      },
    };
    const parsed = parseTasting(old, "TESTE1");
    expect(parsed.version).toBe(TASTING_VERSION);
    expect(parsed.firstName).toBe("Ana");
    expect(parsed.impressions["p1"]?.note).toBe("bom");
    expect(parsed.impressions["p1"]?.pour.name).toBe("Brut");
  });

  it("drops rating values it does not recognise but keeps the Impression", () => {
    const parsed = parseTasting({
      eventCode: "TESTE1",
      impressions: { p1: { ratings: { gostei: "high", corpo: "middling" }, note: "oi" } },
    }, "TESTE1");
    expect(parsed.impressions["p1"]?.ratings).toEqual({ gostei: "high" });
    expect(parsed.impressions["p1"]?.note).toBe("oi");
  });

  it("fills missing wine details rather than producing undefined", () => {
    const parsed = parseTasting({
      eventCode: "TESTE1", impressions: { p1: { note: "oi" } },
    }, "TESTE1");
    expect(parsed.impressions["p1"]?.pour).toEqual({
      name: "", producer: "", vintage: "", grape: "", country: "",
    });
  });

  it("treats a blank first name as no name", () => {
    expect(parseTasting({ eventCode: "TESTE1", firstName: "   " }, "TESTE1").firstName).toBeNull();
  });
});

describe("isStarted", () => {
  const base = { pourId: "p1", ratings: {}, descriptors: [], note: "", pour: {} as never };

  it("is false for an untouched Impression", () => {
    expect(isStarted(undefined)).toBe(false);
    expect(isStarted(base)).toBe(false);
  });

  it("is false for whitespace alone", () => {
    expect(isStarted({ ...base, note: "   " })).toBe(false);
  });

  it("is true once anything is said", () => {
    expect(isStarted({ ...base, ratings: { gostei: "high" } })).toBe(true);
    expect(isStarted({ ...base, descriptors: ["mel"] })).toBe(true);
    expect(isStarted({ ...base, note: "bom" })).toBe(true);
  });
});

describe("upsertImpression", () => {
  it("keeps earlier fields when only one changes", () => {
    const p = pour("p1", 1);
    let t = emptyTasting("TESTE1");
    t = upsertImpression(t, p, { ratings: { gostei: "high" } });
    t = upsertImpression(t, p, { note: "muito bom" });
    expect(t.impressions["p1"]?.ratings).toEqual({ gostei: "high" });
    expect(t.impressions["p1"]?.note).toBe("muito bom");
  });

  it("stores a copy of the wine details, so the Impression stands alone", () => {
    const t = upsertImpression(emptyTasting("TESTE1"), pour("p1", 1, "Brut"), { note: "oi" });
    expect(t.impressions["p1"]?.pour.name).toBe("Brut");
  });

  it("refreshes the stored details, so a corrected vintage reaches the Carousel", () => {
    let t = upsertImpression(emptyTasting("TESTE1"), pour("p1", 1), { note: "oi" });
    t = upsertImpression(t, { ...pour("p1", 1), vintage: "2021" }, { note: "oi" });
    expect(t.impressions["p1"]?.pour.vintage).toBe("2021");
  });

  it("does not mutate the Tasting it was given", () => {
    const before = emptyTasting("TESTE1");
    upsertImpression(before, pour("p1", 1), { note: "oi" });
    expect(before.impressions).toEqual({});
  });
});

describe("carouselImpressions", () => {
  const lineup = [pour("p1", 1), pour("p2", 2), pour("p3", 3)];

  it("returns rated Pours in Lineup order, skipping unrated ones", () => {
    let t = emptyTasting("TESTE1");
    t = upsertImpression(t, lineup[2]!, { note: "terceiro" });
    t = upsertImpression(t, lineup[0]!, { note: "primeiro" });
    expect(carouselImpressions(t, lineup).map((i) => i.note)).toEqual(["primeiro", "terceiro"]);
  });

  it("KEEPS an Impression whose Pour the Organizer removed (ticket 05)", () => {
    let t = emptyTasting("TESTE1");
    t = upsertImpression(t, lineup[0]!, { note: "ainda na lista" });
    t = upsertImpression(t, pour("gone", 9, "Removido"), { note: "removido depois" });

    const result = carouselImpressions(t, lineup);
    expect(result.map((i) => i.note)).toEqual(["ainda na lista", "removido depois"]);
    // Renderable from its own stored copy, with the server no longer knowing it.
    expect(result[1]?.pour.name).toBe("Removido");
  });

  it("is empty when nothing has been rated", () => {
    expect(carouselImpressions(emptyTasting("TESTE1"), lineup)).toEqual([]);
  });

  it("ignores Impressions that were started and then emptied", () => {
    let t = upsertImpression(emptyTasting("TESTE1"), lineup[0]!, { note: "oi" });
    t = upsertImpression(t, lineup[0]!, { note: "" });
    expect(carouselImpressions(t, lineup)).toEqual([]);
    expect(ratedCount(t)).toBe(0);
  });
});
