/**
 * The local Tasting (ticket 10).
 *
 * Impressions never leave the device (ADR-0002), so this is the only place they
 * exist. Three rules matter more than anything else here, and all three exist
 * to avoid destroying someone's evening:
 *
 *   1. Scoped per Event — a new degustação always starts from zero.
 *   2. A version mismatch MIGRATES, never discards.
 *   3. Impressions for Pours the server no longer has are KEPT, not pruned
 *      (ticket 05: an Organizer editing the Lineup must not delete opinions).
 *
 * Parsing is pure and takes raw JSON, so it is testable without localStorage.
 */
import type { AcheiValue, Impression, Pour, PourDetails, Tasting } from "../domain/types";
import { TASTING_VERSION } from "../domain/types";
import { ACHEI_SCALE } from "./content";

const ACHEI_VALUES = new Set(ACHEI_SCALE.map((a) => a.value));

export const storageKey = (eventCode: string) => `tasting:${eventCode}`;

export const emptyTasting = (eventCode: string): Tasting => ({
  version: TASTING_VERSION,
  eventCode,
  firstName: null,
  impressions: {},
});

export const detailsOf = (pour: Pour): PourDetails => ({
  name: pour.name,
  producer: pour.producer,
  vintage: pour.vintage,
  grape: pour.grape,
  country: pour.country,
  tipo: pour.tipo,
  imageUrl: pour.imageUrl,
});

/** An Impression counts as started once the Taster has said anything at all. */
export const isStarted = (impression: Impression | undefined): boolean =>
  !!impression &&
  (Object.keys(impression.ratings).length > 0 ||
    impression.descriptors.length > 0 ||
    impression.note.trim().length > 0 ||
    impression.achei !== null);

export const ratedCount = (tasting: Tasting): number =>
  Object.values(tasting.impressions).filter(isStarted).length;

function parseImpression(raw: unknown, pourId: string): Impression | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  const ratings: Record<string, "low" | "high"> = {};
  if (typeof r["ratings"] === "object" && r["ratings"] !== null) {
    for (const [axis, value] of Object.entries(r["ratings"] as Record<string, unknown>)) {
      if (value === "low" || value === "high") ratings[axis] = value;
    }
  }

  const descriptors = Array.isArray(r["descriptors"])
    ? r["descriptors"].filter((d): d is string => typeof d === "string")
    : [];

  const pourRaw = (typeof r["pour"] === "object" && r["pour"] !== null
    ? (r["pour"] as Record<string, unknown>)
    : {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");

  const achei = typeof r["achei"] === "string" && ACHEI_VALUES.has(r["achei"] as AcheiValue)
    ? (r["achei"] as AcheiValue)
    : null;

  return {
    pourId,
    ratings,
    descriptors,
    note: typeof r["note"] === "string" ? r["note"] : "",
    achei,
    pour: {
      name: str(pourRaw["name"]),
      producer: str(pourRaw["producer"]),
      vintage: str(pourRaw["vintage"]),
      grape: str(pourRaw["grape"]),
      country: str(pourRaw["country"]),
      tipo: typeof pourRaw["tipo"] === "string" ? (pourRaw["tipo"] as PourDetails["tipo"]) : "Outro",
      imageUrl: typeof pourRaw["imageUrl"] === "string" ? pourRaw["imageUrl"] : null,
    },
  };
}

/**
 * Turns whatever was in storage into a usable Tasting. Anything unreadable
 * degrades to an empty Tasting rather than throwing — a Taster mid-evening must
 * never see a crash because of a stray key.
 */
export function parseTasting(raw: unknown, eventCode: string): Tasting {
  if (typeof raw !== "object" || raw === null) return emptyTasting(eventCode);
  const t = raw as Record<string, unknown>;

  // Belongs to a different Event: do not inherit anything from it.
  if (typeof t["eventCode"] === "string" && t["eventCode"] !== eventCode) {
    return emptyTasting(eventCode);
  }

  const impressions: Record<string, Impression> = {};
  if (typeof t["impressions"] === "object" && t["impressions"] !== null) {
    for (const [pourId, value] of Object.entries(t["impressions"] as Record<string, unknown>)) {
      const parsed = parseImpression(value, pourId);
      if (parsed) impressions[pourId] = parsed;
    }
  }

  return {
    // Migrate forward rather than discard: an older shape still holds a real
    // evening, and every field above is parsed defensively anyway.
    version: TASTING_VERSION,
    eventCode,
    firstName: typeof t["firstName"] === "string" && t["firstName"].trim() !== ""
      ? t["firstName"]
      : null,
    impressions,
  };
}

export function loadTasting(eventCode: string): Tasting {
  try {
    const raw = localStorage.getItem(storageKey(eventCode));
    if (!raw) return emptyTasting(eventCode);
    return parseTasting(JSON.parse(raw), eventCode);
  } catch {
    return emptyTasting(eventCode);
  }
}

export function saveTasting(tasting: Tasting): void {
  try {
    localStorage.setItem(storageKey(tasting.eventCode), JSON.stringify(tasting));
  } catch {
    /* private mode or quota: the evening continues in memory */
  }
}

export function upsertImpression(
  tasting: Tasting,
  pour: Pour,
  change: Partial<Pick<Impression, "ratings" | "descriptors" | "note" | "achei">>,
): Tasting {
  const existing = tasting.impressions[pour.id];
  const next: Impression = {
    pourId: pour.id,
    ratings: change.ratings ?? existing?.ratings ?? {},
    descriptors: change.descriptors ?? existing?.descriptors ?? [],
    note: change.note ?? existing?.note ?? "",
    achei: change.achei ?? existing?.achei ?? null,
    // Refreshed every time, so a corrected vintage reaches the Carousel.
    pour: detailsOf(pour),
  };
  return { ...tasting, impressions: { ...tasting.impressions, [pour.id]: next } };
}

/**
 * The Impressions a Carousel is built from: every rated Pour still in the
 * Lineup, in Lineup order, followed by any rated Pour the Organizer has since
 * removed — kept, per ticket 05, and rendered from its stored copy of the wine
 * details.
 */
export function carouselImpressions(
  tasting: Tasting,
  lineup: readonly Pour[],
): Impression[] {
  const inLineup: Impression[] = [];
  for (const pour of lineup) {
    const impression = tasting.impressions[pour.id];
    if (isStarted(impression)) inLineup.push(impression!);
  }
  const lineupIds = new Set(lineup.map((p) => p.id));
  const orphans = Object.values(tasting.impressions).filter(
    (i) => isStarted(i) && !lineupIds.has(i.pourId),
  );
  return [...inLineup, ...orphans];
}
