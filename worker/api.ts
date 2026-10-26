/**
 * The Event API. Pure request handling — no D1 access, no Response building
 * beyond JSON, so the interesting parts are testable without workerd.
 */
import type { Event, Pour, Tipo } from "../src/domain/types";

export interface EventRow {
  id: string;
  code: string;
  name: string;
  date: string;
}

export interface PourRow {
  id: string;
  event_id: string;
  position: number;
  name: string;
  producer: string;
  vintage: string;
  grape: string;
  country: string;
  tipo: string;
  image_key: string | null;
}

export const TIPOS: readonly Tipo[] = [
  "Tinto",
  "Branco",
  "Rosé",
  "Espumante",
  "Fortificado",
  "Outro",
];

const isTipo = (value: unknown): value is Tipo => TIPOS.includes(value as Tipo);

/**
 * `eventCode` is the Event's public code (not its internal id) — the image
 * route is public, so the URL it builds has to be reachable by a Taster who
 * only ever knows the code.
 */
export const toPour = (row: PourRow, eventCode: string): Pour => ({
  id: row.id,
  position: row.position,
  name: row.name,
  producer: row.producer,
  vintage: row.vintage,
  grape: row.grape,
  country: row.country,
  tipo: isTipo(row.tipo) ? row.tipo : "Outro",
  imageUrl: row.image_key
    ? `/api/events/${eventCode}/pours/${row.id}/image`
    : null,
});

export const toEvent = (row: EventRow, pours: readonly PourRow[]): Event => ({
  id: row.id,
  code: row.code,
  name: row.name,
  date: row.date,
  lineup: pours.map((p) => toPour(p, row.code)),
});

/**
 * Ticket 09: the passcode is checked in the API on every mutating route, never
 * only by hiding the admin UI. Compared against a Wrangler secret.
 */
export function isAuthorised(header: string | null, secret: string | undefined): boolean {
  if (!secret) return false;
  const prefix = "Bearer ";
  if (!header || !header.startsWith(prefix)) return false;
  return timingSafeEqual(header.slice(prefix.length).trim(), secret);
}

/** Not security-critical at this threat model, but free to do properly. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export interface EventInput {
  readonly name: string;
  readonly date: string;
}

/** Ticket 05: an Event requires both a name and a date. */
export function parseEventInput(body: unknown): EventInput | { error: string } {
  if (typeof body !== "object" || body === null) return { error: "Corpo inválido" };
  const { name, date } = body as Record<string, unknown>;
  if (typeof name !== "string" || name.trim() === "") return { error: "Nome é obrigatório" };
  if (typeof date !== "string" || date.trim() === "") return { error: "Data é obrigatória" };
  return { name: name.trim(), date: date.trim() };
}

/**
 * `imageUrl` is server-computed (never client-sent); everything else,
 * including `id`, is carried by the client. Ticket: stable Pour ids — the
 * client generates a Pour's id once via crypto.randomUUID() when it is first
 * added, and sends that same id on every subsequent putLineup call, so a
 * bottle image (keyed by Pour id) survives unrelated edits instead of being
 * orphaned by a wholesale delete+reinsert.
 */
export type PourInput = Omit<Pour, "imageUrl">;

/**
 * The Lineup is upserted by id (not replaced wholesale — see the stable-id
 * ticket), so this validates the entire array. Positions are reassigned from
 * array order — the client's ordering is the truth, and trusting a
 * client-sent `position` invites gaps and duplicates.
 */
export function parseLineupInput(body: unknown): PourInput[] | { error: string } {
  const pours = (body as { pours?: unknown } | null)?.pours;
  if (!Array.isArray(pours)) return { error: "Lista de vinhos inválida" };

  const parsed: PourInput[] = [];
  for (const [index, raw] of pours.entries()) {
    if (typeof raw !== "object" || raw === null) return { error: `Vinho ${index + 1} inválido` };
    const p = raw as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const id = str(p["id"]);
    if (id === "") return { error: `Vinho ${index + 1} sem id` };
    const name = str(p["name"]);
    const producer = str(p["producer"]);
    // A Pour is usable with just a name or a producer (ticket 06) — an
    // Organizer typing at the venue is never blocked by a missing grape.
    if (name === "" && producer === "") {
      return { error: `Vinho ${index + 1} precisa de nome ou produtor` };
    }
    // Tipo is a fact the Organizer sets once; an old/partial client payload
    // missing it (or sending junk) defaults rather than 400s.
    const tipoRaw = p["tipo"];
    const tipo: Tipo = isTipo(tipoRaw) ? tipoRaw : "Outro";
    parsed.push({
      id,
      position: index + 1,
      name,
      producer,
      vintage: str(p["vintage"]),
      grape: str(p["grape"]),
      country: str(p["country"]),
      tipo,
    });
  }
  return parsed;
}

/** PNG magic bytes: 89 50 4E 47 — sniffed, not trusted from Content-Type alone. */
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];

/** 8MB (ticket: bottle PNG upload) — see TECH_LEAD_MEMORY for why not 3MB. */
export const MAX_PNG_BYTES = 8 * 1024 * 1024;

/**
 * Pure so it's unit-testable without a real request/R2. `contentType` is
 * checked as a fast, cheap signal; the magic-byte sniff is what's actually
 * trusted against the upload being a PNG.
 */
export function validatePngUpload(
  bytes: Uint8Array,
  contentType: string | null,
): { ok: true } | { error: string } {
  if (contentType !== "image/png") return { error: "Tipo de ficheiro inválido" };
  if (bytes.length > MAX_PNG_BYTES) return { error: "Imagem demasiado grande" };
  const hasPngMagic = PNG_MAGIC.every((byte, index) => bytes[index] === byte);
  if (bytes.length < PNG_MAGIC.length || !hasPngMagic) {
    return { error: "Ficheiro não é um PNG válido" };
  }
  return { ok: true };
}

export const json = (data: unknown, status = 200) =>
  Response.json(data, { status });

export const fail = (message: string, status: number) =>
  Response.json({ error: message }, { status });
