/** PROTOTYPE — throwaway. Bits genuinely shared by all three variants. */
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

/** Stub for ticket 07 — the rating screen is a separate ticket, not invented here. */
export function RatingStub({
  pour,
  onRate,
  onClose,
}: {
  pour: StubPour;
  onRate: () => void;
  onClose: () => void;
}) {
  return (
    <div style={sheetWrap} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 12, color: C.mut, marginBottom: 6 }}>
          Vinho {pour.position}
        </div>
        <div style={{ fontWeight: 700, fontSize: 17 }}>{wineLine(pour)}</div>
        <div style={{ fontSize: 13, color: C.mut, marginTop: 3 }}>{wineSub(pour)}</div>

        <div style={stubBox}>
          A tela de avaliação é o ticket 07 — eixos em linguagem simples,
          descritores e a nota de até três linhas. Não foi inventada aqui.
        </div>

        <button onClick={onRate} style={primaryBtn}>Marcar como avaliado</button>
        <button onClick={onClose} style={ghostBtn}>Voltar</button>
      </div>
    </div>
  );
}

const sheetWrap: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(28,25,23,.45)",
  display: "flex", alignItems: "flex-end", zIndex: 50,
};
const sheet: React.CSSProperties = {
  background: "#fff", width: "100%", borderRadius: "18px 18px 0 0",
  padding: "22px 20px 28px",
};
const stubBox: React.CSSProperties = {
  border: `1px dashed ${C.line}`, borderRadius: 10, padding: 14,
  fontSize: 13, color: C.mut, lineHeight: 1.5, margin: "18px 0",
};
export const primaryBtn: React.CSSProperties = {
  width: "100%", padding: "15px", border: 0, borderRadius: 11,
  background: C.wine, color: "#fff", fontSize: 15, fontWeight: 700,
};
export const ghostBtn: React.CSSProperties = {
  width: "100%", padding: "13px", marginTop: 8, border: 0,
  background: "transparent", color: C.mut, fontSize: 14,
};

/** ADR-0004: the Carousel is pre-rendered, so "not ready yet" is a real state. */
export function shareLabel(ready: boolean, count: number) {
  if (count === 0) return "Avalie um vinho para começar";
  return ready ? `Compartilhar ${count} ${count === 1 ? "vinho" : "vinhos"}` : "Preparando suas imagens…";
}
