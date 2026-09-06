import { describe, expect, it } from "vitest";
import {
  CODE_ALPHABET,
  CODE_LENGTH,
  generateEventCode,
  isValidEventCode,
  normaliseEventCode,
} from "./eventCode";

describe("generateEventCode", () => {
  it("produces a code of the agreed length from the agreed alphabet", () => {
    const code = generateEventCode();
    expect(code).toHaveLength(CODE_LENGTH);
    expect([...code].every((c) => CODE_ALPHABET.includes(c))).toBe(true);
  });

  it("never emits the ambiguous letters Crockford drops", () => {
    // 400 codes is ~2400 characters; I/L/O/U would show up if they could.
    const many = Array.from({ length: 400 }, () => generateEventCode()).join("");
    expect(many).not.toMatch(/[ILOU]/);
  });

  it("is driven entirely by the injected random source", () => {
    expect(generateEventCode(() => 0)).toBe("000000");
    expect(generateEventCode(() => 0.999999)).toBe("ZZZZZZ");
  });

  it("does not repeat itself in practice", () => {
    const codes = new Set(Array.from({ length: 500 }, () => generateEventCode()));
    expect(codes.size).toBeGreaterThan(495);
  });
});

describe("normaliseEventCode", () => {
  it("accepts what a Taster actually types", () => {
    expect(normaliseEventCode("  k3m2qx ")).toBe("K3M2QX");
  });

  it("maps the letters Crockford reads as digits", () => {
    expect(normaliseEventCode("IL0")).toBe("110");
    expect(normaliseEventCode("O")).toBe("0");
  });

  it("strips separators people add to printed codes", () => {
    expect(normaliseEventCode("K3M-2QX")).toBe("K3M2QX");
  });
});

describe("isValidEventCode", () => {
  it("accepts a generated code", () => {
    expect(isValidEventCode(generateEventCode())).toBe(true);
  });

  it("accepts a sloppily typed one", () => {
    expect(isValidEventCode(" k3m2qx ")).toBe(true);
  });

  it("rejects wrong lengths", () => {
    expect(isValidEventCode("K3M2Q")).toBe(false);
    expect(isValidEventCode("K3M2QXZ")).toBe(false);
  });

  it("rejects U, which the alphabet excludes and normalising does not rescue", () => {
    expect(isValidEventCode("K3M2QU")).toBe(false);
  });
});
