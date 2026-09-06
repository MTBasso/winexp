/** PROTOTYPE — throwaway. Variant A: "Lista" — the whole Lineup, always visible. */
import { useState } from "react";
import { STUB_EVENT, ratedCount, type Impressions, type StubPour } from "./stubData";
import { C, RatingStub, shareLabel, wineLine, wineSub } from "./shared";

export const NAME_A = "Lista — tudo à vista";

export function VariantA({
  impressions, rate, firstName, setFirstName, shareReady,
}: {
  impressions: Impressions;
  rate: (id: string) => void;
  firstName: string | null;
  setFirstName: (n: string) => void;
  shareReady: boolean;
}) {
  const [open, setOpen] = useState<StubPour | null>(null);
  const [nameDismissed, setNameDismissed] = useState(false);
  const done = ratedCount(impressions);

  return (
    <div style={{ background: C.cream, minHeight: "100vh", paddingBottom: 96 }}>
      <header style={{ padding: "26px 20px 18px", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: C.wineSoft }}>
          Degustação · {STUB_EVENT.date}
        </div>
        <h1 style={{ fontSize: 26, margin: "6px 0 4px", color: C.ink }}>{STUB_EVENT.name}</h1>
        <div style={{ fontSize: 14, color: C.mut }}>
          {done === 0 ? `${STUB_EVENT.lineup.length} vinhos esta noite` : `${done} de ${STUB_EVENT.lineup.length} avaliados`}
        </div>
        <div style={{ height: 4, background: C.line, borderRadius: 3, marginTop: 12, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(done / STUB_EVENT.lineup.length) * 100}%`, background: C.wine, transition: "width .3s" }} />
        </div>
      </header>

      {!firstName && !nameDismissed && done >= 1 && (
        <div style={{ margin: "14px 16px", padding: 14, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12 }}>
          <div style={{ fontSize: 14, marginBottom: 8 }}>Como você se chama?</div>
          <div style={{ fontSize: 12, color: C.mut, marginBottom: 10 }}>
            Só para assinar suas imagens. Pode pular.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="Seu primeiro nome"
              onKeyDown={(e) => { if (e.key === "Enter") setFirstName((e.target as HTMLInputElement).value); }}
              style={{ flex: 1, padding: "11px 12px", border: `1px solid ${C.line}`, borderRadius: 9, fontSize: 15 }}
            />
            <button onClick={() => setNameDismissed(true)} style={{ border: 0, background: "transparent", color: C.mut, fontSize: 13 }}>
              pular
            </button>
          </div>
        </div>
      )}

      <ul style={{ listStyle: "none", margin: 0, padding: "8px 16px" }}>
        {STUB_EVENT.lineup.map((p) => {
          const rated = !!impressions[p.id];
          return (
            <li key={p.id}>
              <button
                onClick={() => setOpen(p)}
                style={{
                  width: "100%", textAlign: "left", display: "flex", gap: 14, alignItems: "center",
                  padding: "15px 14px", marginBottom: 8, borderRadius: 12,
                  border: `1px solid ${rated ? "transparent" : C.line}`,
                  background: rated ? "#fff" : "#fffdfa",
                }}
              >
                <span style={{
                  flex: "0 0 34px", height: 34, borderRadius: 999, display: "grid", placeItems: "center",
                  background: rated ? C.wine : "#fff", color: rated ? "#fff" : C.mut,
                  border: `1px solid ${rated ? C.wine : C.line}`, fontSize: 13, fontWeight: 700,
                }}>
                  {rated ? "✓" : p.position}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontWeight: 600, fontSize: 15, color: C.ink }}>{wineLine(p)}</span>
                  <span style={{ display: "block", fontSize: 12.5, color: C.mut, marginTop: 2 }}>{wineSub(p)}</span>
                </span>
                <span style={{ fontSize: 12, color: rated ? C.wineSoft : C.mut, whiteSpace: "nowrap" }}>
                  {rated ? "editar" : "avaliar"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, padding: "12px 16px 20px", background: "linear-gradient(transparent, #faf7f2 22%)" }}>
        <button disabled={done === 0 || !shareReady}
          style={{ width: "100%", padding: 16, borderRadius: 12, border: 0, fontSize: 15, fontWeight: 700,
            background: done > 0 && shareReady ? C.wine : "#e7e5e4", color: done > 0 && shareReady ? "#fff" : C.mut }}>
          {shareLabel(shareReady, done)}
        </button>
      </div>

      {open && <RatingStub pour={open} onRate={() => { rate(open.id); setOpen(null); }} onClose={() => setOpen(null)} />}
    </div>
  );
}
