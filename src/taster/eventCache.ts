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
