/**
 * The Lineup is cached on first load so the whole evening survives dead venue
 * wifi (a near-certainty in a restaurant basement). Impressions are local
 * anyway, so once this page has opened once, nothing else needs the network.
 */
import type { Event } from "../domain/types";

const key = (code: string) => `event:${code}`;

export function cacheEvent(event: Event): void {
  try {
    localStorage.setItem(key(event.code), JSON.stringify(event));
  } catch {
    /* private mode: the Taster just needs the network to stay up */
  }
}

export function cachedEvent(code: string): Event | null {
  try {
    const raw = localStorage.getItem(key(code));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Event;
    if (!parsed || typeof parsed.code !== "string" || !Array.isArray(parsed.lineup)) return null;
    return parsed;
  } catch {
    return null;
  }
}

const BOTTLE_IMAGE_CACHE = "bottle-images";

/**
 * A parallel image-caching path, deliberately NOT going through
 * localStorage above — an 8MB PNG would blow that quota. Uses the Cache API
 * instead. Best-effort: one failed image must never break caching the rest.
 */
export async function cacheBottleImages(event: Event): Promise<void> {
  if (typeof caches === "undefined") return;
  let cache: Cache;
  try {
    cache = await caches.open(BOTTLE_IMAGE_CACHE);
  } catch {
    return; // private mode or unsupported: the Taster just needs the network to stay up
  }
  for (const pour of event.lineup) {
    if (!pour.imageUrl) continue;
    try {
      await cache.add(pour.imageUrl);
    } catch {
      /* one bad image must not break caching the rest */
    }
  }
}
