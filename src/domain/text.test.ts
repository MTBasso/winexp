import { describe, expect, it } from "vitest";
import { clampGraphemes, countGraphemes, NOTE_MAX_GRAPHEMES } from "./text";

describe("countGraphemes", () => {
  it("counts plain text", () => {
    expect(countGraphemes("Adorei esse vinho")).toBe(17);
  });

  it("counts an accented pt-BR word as its visible characters", () => {
    expect(countGraphemes("não")).toBe(3);
  });

  it("counts a combining sequence as one character, unlike String.length", () => {
    const decomposed = "naõ"; // n a o + combining tilde
    expect(decomposed.length).toBe(4);
    expect(countGraphemes(decomposed)).toBe(3);
  });

  it("counts an emoji as one, unlike String.length", () => {
    expect("🍷".length).toBe(2);
    expect(countGraphemes("🍷")).toBe(1);
  });

  it("counts a multi-codepoint emoji as one", () => {
    expect(countGraphemes("👨‍👩‍👧")).toBe(1);
  });

  it("is empty for empty", () => {
    expect(countGraphemes("")).toBe(0);
  });
});

describe("clampGraphemes", () => {
  it("leaves text within budget untouched", () => {
    expect(clampGraphemes("curto", 10)).toBe("curto");
  });

  it("trims to the budget", () => {
    expect(clampGraphemes("abcdefghij", 4)).toBe("abcd");
  });

  it("never splits an emoji into broken halves", () => {
    const clamped = clampGraphemes("🍷🍷🍷", 2);
    expect(clamped).toBe("🍷🍷");
    expect(countGraphemes(clamped)).toBe(2);
  });

  it("never splits a combining sequence", () => {
    expect(clampGraphemes("naõx", 3)).toBe("naõ");
  });

  it("defaults to the Note budget", () => {
    const long = "a".repeat(300);
    expect(countGraphemes(clampGraphemes(long))).toBe(NOTE_MAX_GRAPHEMES);
  });
});
