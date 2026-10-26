/**
 * The domain, in the words CONTEXT.md defines. These names are load-bearing:
 * they are the glossary, and the `_Avoid_` lists there are enforced. Not
 * "restaurant", not "customer", not "review".
 *
 * Shared by the client and the Worker — the Vite plugin builds them together,
 * so no package boundary is needed.
 */

/** A single tasting, on one date, at one venue, with its own Lineup. */
export interface Event {
  readonly id: string;
  /** Six characters of Crockford base32; appears in the QR URL. */
  readonly code: string;
  readonly name: string;
  readonly date: string;
  readonly lineup: readonly Pour[];
}

/** Tipo: a fact about the wine, set once by the Organizer — not a Taster Impression axis. */
export type Tipo = "Tinto" | "Branco" | "Rosé" | "Espumante" | "Fortificado" | "Outro";

/**
 * One wine's place in one Event's Lineup. Carries its own wine details — there
 * is no reusable Wine catalogue, by decision.
 */
export interface Pour {
  /** Client-generated once via crypto.randomUUID() when the Pour is first
   * added, and kept stable across every subsequent putLineup call — this is
   * what lets a bottle image (keyed by Pour id) survive unrelated edits. */
  readonly id: string;
  readonly position: number;
  readonly name: string;
  readonly producer: string;
  readonly vintage: string;
  readonly grape: string;
  readonly country: string;
  readonly tipo: Tipo;
  /** Server-computed; null until a bottle photo has been uploaded for this Pour. */
  readonly imageUrl: string | null;
}

/** The wine details copied onto an Impression, so a Tasting is self-sufficient. */
export type PourDetails = Omit<Pour, "id" | "position">;

/** A plain-language dimension a Pour is rated on. */
export interface Axis {
  readonly id: string;
  readonly question: string;
  readonly low: string;
  readonly high: string;
}

/**
 * The 5-point "O que achei" scale. A sibling field on Impression, not folded
 * into `ratings` — it supersedes the old `gostei` Axis; the remaining Axes
 * (`corpo`/`doce`/`denovo`) are not what this re-asks.
 */
export type AcheiValue = "excelente" | "muito_bom" | "bom" | "regular" | "nao_gostei";

/** One Taster's complete response to one Pour. */
export interface Impression {
  readonly pourId: string;
  /** Axis id -> the option tapped. Ticket 07: two-way, so `low` or `high`. */
  readonly ratings: Readonly<Record<string, "low" | "high">>;
  readonly descriptors: readonly string[];
  readonly note: string;
  readonly achei: AcheiValue | null;
  /**
   * A copy of the Pour's wine details, taken when the Impression was recorded.
   * This is what lets a Tasting outlive an Organizer removing the Pour, and it
   * is why a Slide can be rendered without consulting the server.
   */
  readonly pour: PourDetails;
}

/** One Taster's pass through one Event's Lineup. Never leaves the device. */
export interface Tasting {
  readonly version: number;
  readonly eventCode: string;
  readonly firstName: string | null;
  readonly impressions: Readonly<Record<string, Impression>>;
}

export const TASTING_VERSION = 1;
