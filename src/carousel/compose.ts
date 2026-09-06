/**
 * What goes into a Carousel, and in what order (ticket 08).
 *
 * The binding constraint is Chromium, not Instagram: `navigator.share` rejects
 * more than 10 files, while Instagram allows 20 items. So the cap is 10, and
 * the cover is what gives when a Taster has been enthusiastic — it carries the
 * least information of any Slide.
 */
import type { Impression } from "../domain/types";

/** Chromium rejects a share past this. Ticket 01. */
export const MAX_FILES = 10;

export interface Carousel {
  readonly includeCover: boolean;
  readonly impressions: readonly Impression[];
  /** True when Impressions were left out entirely, not merely uncovered. */
  readonly truncated: boolean;
}

export function composeCarousel(rated: readonly Impression[]): Carousel {
  if (rated.length === 0) {
    return { includeCover: false, impressions: [], truncated: false };
  }
  // Cover plus every Impression still fits.
  if (rated.length + 1 <= MAX_FILES) {
    return { includeCover: true, impressions: rated, truncated: false };
  }
  // Drop the cover first; that alone may be enough.
  if (rated.length <= MAX_FILES) {
    return { includeCover: false, impressions: rated, truncated: false };
  }
  // Still over: keep the first ten in Lineup order — the evening as it
  // happened, which needs no tie-breaking against a two-valued Axis.
  return {
    includeCover: false,
    impressions: rated.slice(0, MAX_FILES),
    truncated: true,
  };
}

export const slideCount = (carousel: Carousel): number =>
  carousel.impressions.length + (carousel.includeCover ? 1 : 0);
