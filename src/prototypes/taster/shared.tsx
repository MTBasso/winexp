/** PROTOTYPE — throwaway. Bits the settled deck still uses. */
import type { StubPour } from "./stubData";

export const C = {
  wine: "#7f1d1d",
  wineSoft: "#a8544f",
  ink: "#1c1917",
  mut: "#78716c",
  line: "#e7e5e4",
  cream: "#faf7f2",
  gold: "#a16207",
};

export const wineLine = (p: StubPour) => `${p.producer} · ${p.name}`;
export const wineSub = (p: StubPour) => `${p.vintage} · ${p.grape} · ${p.country}`;
