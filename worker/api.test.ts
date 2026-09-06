import { describe, expect, it } from "vitest";
import {
  isAuthorised,
  parseEventInput,
  parseLineupInput,
  toEvent,
  type PourRow,
} from "./api";

const row = (over: Partial<PourRow> = {}): PourRow => ({
  id: "p1", event_id: "e1", position: 1, name: "Douro Tinto",
  producer: "Quinta do Crasto", vintage: "2020", grape: "Touriga", country: "Portugal",
  ...over,
});

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
    const parsed = parseLineupInput({ pours: [{ name: "Brut" }, { producer: "Aveleda" }] });
    expect(parsed).toHaveLength(2);
  });

  it("rejects a Pour with neither, naming which one", () => {
    const parsed = parseLineupInput({ pours: [{ name: "Brut" }, { vintage: "2020" }] });
    expect(parsed).toHaveProperty("error");
    expect((parsed as { error: string }).error).toContain("2");
  });

  it("reassigns positions from array order, ignoring what the client sent", () => {
    const parsed = parseLineupInput({
      pours: [{ name: "A", position: 99 }, { name: "B", position: 3 }],
    }) as { position: number }[];
    expect(parsed.map((p) => p.position)).toEqual([1, 2]);
  });

  it("defaults the optional wine details to empty strings", () => {
    const [pour] = parseLineupInput({ pours: [{ name: "Brut" }] }) as { grape: string }[];
    expect(pour?.grape).toBe("");
  });

  it("accepts an empty Lineup — an Organizer may clear the list", () => {
    expect(parseLineupInput({ pours: [] })).toEqual([]);
  });

  it("rejects a missing or non-array pours field", () => {
    expect(parseLineupInput({})).toHaveProperty("error");
    expect(parseLineupInput({ pours: "one" })).toHaveProperty("error");
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
});
