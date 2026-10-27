import { describe, expect, it } from "vitest";
import {
  isAuthorised,
  parseEventInput,
  parseLineupInput,
  toEvent,
  validateImageUpload,
  type PourRow,
} from "./api";

const row = (over: Partial<PourRow> = {}): PourRow => ({
  id: "p1", event_id: "e1", position: 1, name: "Douro Tinto",
  producer: "Quinta do Crasto", vintage: "2020", grape: "Touriga", country: "Portugal",
  tipo: "Tinto", image_key: null,
  ...over,
});

const PNG_HEADER = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// RIFF container (bytes 0-3) + arbitrary chunk size (4-7) + WEBP chunk type (8-11).
const WEBP_HEADER = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

describe("isAuthorised", () => {
  it("accepts the right passcode as a bearer token", () => {
    expect(isAuthorised("Bearer hunter2", "hunter2")).toBe(true);
  });

  it("rejects the wrong passcode", () => {
    expect(isAuthorised("Bearer nope", "hunter2")).toBe(false);
  });

  it("rejects a missing or malformed header", () => {
    expect(isAuthorised(null, "hunter2")).toBe(false);
    expect(isAuthorised("hunter2", "hunter2")).toBe(false);
    expect(isAuthorised("Basic hunter2", "hunter2")).toBe(false);
  });

  it("fails closed when the secret is unset, rather than letting everyone in", () => {
    expect(isAuthorised("Bearer anything", undefined)).toBe(false);
    expect(isAuthorised("Bearer ", "")).toBe(false);
  });
});

describe("parseEventInput", () => {
  it("requires both a name and a date (ticket 05)", () => {
    expect(parseEventInput({ name: "Douro", date: "" })).toHaveProperty("error");
    expect(parseEventInput({ name: "  ", date: "6 de setembro" })).toHaveProperty("error");
  });

  it("trims what it accepts", () => {
    expect(parseEventInput({ name: "  Douro  ", date: " 6 de setembro " }))
      .toEqual({ name: "Douro", date: "6 de setembro" });
  });

  it("rejects a non-object body", () => {
    expect(parseEventInput(null)).toHaveProperty("error");
    expect(parseEventInput("Douro")).toHaveProperty("error");
  });
});

describe("parseLineupInput", () => {
  it("accepts a Pour with only a name, or only a producer", () => {
    const parsed = parseLineupInput({
      pours: [{ id: "p1", name: "Brut" }, { id: "p2", producer: "Aveleda" }],
    });
    expect(parsed).toHaveLength(2);
  });

  it("rejects a Pour with neither, naming which one", () => {
    const parsed = parseLineupInput({
      pours: [{ id: "p1", name: "Brut" }, { id: "p2", vintage: "2020" }],
    });
    expect(parsed).toHaveProperty("error");
    expect((parsed as { error: string }).error).toContain("2");
  });

  it("reassigns positions from array order, ignoring what the client sent", () => {
    const parsed = parseLineupInput({
      pours: [
        { id: "p1", name: "A", position: 99 },
        { id: "p2", name: "B", position: 3 },
      ],
    }) as { position: number }[];
    expect(parsed.map((p) => p.position)).toEqual([1, 2]);
  });

  it("defaults the optional wine details to empty strings", () => {
    const [pour] = parseLineupInput({ pours: [{ id: "p1", name: "Brut" }] }) as {
      grape: string;
    }[];
    expect(pour?.grape).toBe("");
  });

  it("accepts an empty Lineup — an Organizer may clear the list", () => {
    expect(parseLineupInput({ pours: [] })).toEqual([]);
  });

  it("rejects a missing or non-array pours field", () => {
    expect(parseLineupInput({})).toHaveProperty("error");
    expect(parseLineupInput({ pours: "one" })).toHaveProperty("error");
  });

  it("requires a non-empty id on every Pour — stable ids are the upsert key", () => {
    expect(parseLineupInput({ pours: [{ name: "Brut" }] })).toHaveProperty("error");
    expect(parseLineupInput({ pours: [{ id: "", name: "Brut" }] })).toHaveProperty("error");
    expect(parseLineupInput({ pours: [{ id: "  ", name: "Brut" }] })).toHaveProperty("error");
    expect(parseLineupInput({ pours: [{ id: 42, name: "Brut" }] })).toHaveProperty("error");
  });

  it("carries a client-sent id through unchanged", () => {
    const [pour] = parseLineupInput({ pours: [{ id: "p1", name: "Brut" }] }) as {
      id: string;
    }[];
    expect(pour?.id).toBe("p1");
  });

  it("defaults tipo to Outro when missing or invalid, without 400ing", () => {
    const parsed = parseLineupInput({
      pours: [
        { id: "p1", name: "Brut" },
        { id: "p2", name: "Malbec", tipo: "not-a-tipo" },
      ],
    }) as { tipo: string }[];
    expect(parsed.map((p) => p.tipo)).toEqual(["Outro", "Outro"]);
  });

  it("accepts a valid tipo", () => {
    const [pour] = parseLineupInput({
      pours: [{ id: "p1", name: "Malbec", tipo: "Tinto" }],
    }) as { tipo: string }[];
    expect(pour?.tipo).toBe("Tinto");
  });
});

describe("validateImageUpload", () => {
  it("accepts a correctly-typed, correctly-signed, small PNG", () => {
    expect(validateImageUpload(PNG_HEADER, "image/png")).toEqual({ ok: true, contentType: "image/png" });
  });

  it("accepts a correctly-typed, correctly-signed, small WebP", () => {
    expect(validateImageUpload(WEBP_HEADER, "image/webp")).toEqual({ ok: true, contentType: "image/webp" });
  });

  it("rejects a content type that isn't PNG or WebP even if the bytes look right", () => {
    expect(validateImageUpload(PNG_HEADER, "image/jpeg")).toHaveProperty("error");
    expect(validateImageUpload(PNG_HEADER, null)).toHaveProperty("error");
  });

  it("rejects bytes that don't start with the PNG signature", () => {
    const notPng = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    expect(validateImageUpload(notPng, "image/png")).toHaveProperty("error");
  });

  it("rejects bytes that don't carry the RIFF/WEBP signature", () => {
    const notWebp = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    expect(validateImageUpload(notWebp, "image/webp")).toHaveProperty("error");
  });

  it("rejects a Content-Type/bytes mismatch (PNG header declared as WebP)", () => {
    expect(validateImageUpload(PNG_HEADER, "image/webp")).toHaveProperty("error");
  });

  it("rejects a PNG over the 8MB cap", () => {
    const tooBig = new Uint8Array(8 * 1024 * 1024 + 1);
    tooBig.set(PNG_HEADER);
    expect(validateImageUpload(tooBig, "image/png")).toHaveProperty("error");
  });

  it("rejects a WebP over the 8MB cap", () => {
    const tooBig = new Uint8Array(8 * 1024 * 1024 + 1);
    tooBig.set(WEBP_HEADER);
    expect(validateImageUpload(tooBig, "image/webp")).toHaveProperty("error");
  });
});

describe("toEvent", () => {
  it("shapes rows into the domain Event, dropping database-only fields", () => {
    const event = toEvent(
      { id: "e1", code: "K3M2QX", name: "Douro", date: "6 de setembro" },
      [row(), row({ id: "p2", position: 2, name: "Malbec" })],
    );
    expect(event.lineup).toHaveLength(2);
    expect(event.lineup[0]).not.toHaveProperty("event_id");
    expect(event.lineup[1]?.name).toBe("Malbec");
  });

  it("falls back an invalid stored tipo to Outro", () => {
    const event = toEvent(
      { id: "e1", code: "K3M2QX", name: "Douro", date: "6 de setembro" },
      [row({ tipo: "garbage" })],
    );
    expect(event.lineup[0]?.tipo).toBe("Outro");
  });

  it("builds imageUrl from the Event's code when a Pour has an image_key, else null", () => {
    const event = toEvent(
      { id: "e1", code: "K3M2QX", name: "Douro", date: "6 de setembro" },
      [row({ image_key: "p1-123.png" }), row({ id: "p2", image_key: null })],
    );
    expect(event.lineup[0]?.imageUrl).toBe("/api/events/K3M2QX/pours/p1/image");
    expect(event.lineup[1]?.imageUrl).toBeNull();
  });
});
