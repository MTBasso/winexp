/** PROTOTYPE — throwaway. Variant B: "Baralho" — one Pour fills the screen, swipe through. */
import { useState } from "react";
import { STUB_EVENT, ratedCount, type Impressions } from "./stubData";
import { C, RatingStub, shareLabel, wineSub } from "./shared";

export const NAME_B = "Baralho — um vinho por vez";

export function VariantB({
  impressions, rate, firstName, setFirstName, shareReady,
}: {
  impressions: Impressions;
  rate: (id: string) => void;
  firstName: string | null;
  setFirstName: (n: string) => void;
  shareReady: boolean;
}) {
  const cards = STUB_EVENT.lineup.length + 1; // + the closing share card
  const [i, setI] = useState(0);
  const [rating, setRating] = useState(false);
  const done = ratedCount(impressions);
  const pour = STUB_EVENT.lineup[i];
  const onShareCard = i === cards - 1;

  return (
    <div style={{ background: C.ink, minHeight: "100vh", color: "#fafaf9", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", gap: 5, padding: "20px 20px 0" }}>
        {Array.from({ length: cards }).map((_, n) => (
          <span key={n} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: n === i ? "#fafaf9" : n < i ? C.wineSoft : "rgba(250,250,249,.22)",
          }} />
        ))}
      </div>

      <div style={{ padding: "16px 20px 0", fontSize: 12, color: "rgba(250,250,249,.55)" }}>
        {STUB_EVENT.name} · {STUB_EVENT.date}
      </div>

      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: "0 24px" }}>
        {onShareCard ? (
          <div style={{ textAlign: "center", maxWidth: 320 }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🍷</div>
            <h2 style={{ fontSize: 24, margin: "0 0 10px" }}>
              {done === 0 ? "Nenhum vinho avaliado ainda" : `Você avaliou ${done} ${done === 1 ? "vinho" : "vinhos"}`}
            </h2>
            {!firstName && done > 0 && (
              <input
                placeholder="Seu primeiro nome (opcional)"
                onKeyDown={(e) => { if (e.key === "Enter") setFirstName((e.target as HTMLInputElement).value); }}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: 0, fontSize: 15, margin: "14px 0 4px" }}
              />
            )}
            <button disabled={done === 0 || !shareReady}
              style={{ width: "100%", marginTop: 16, padding: 16, borderRadius: 12, border: 0, fontSize: 15, fontWeight: 700,
                background: done > 0 && shareReady ? "#fafaf9" : "rgba(250,250,249,.15)",
                color: done > 0 && shareReady ? C.ink : "rgba(250,250,249,.5)" }}>
              {shareLabel(shareReady, done)}
            </button>
            <button onClick={() => setI(0)} style={{ marginTop: 10, background: "transparent", border: 0, color: "rgba(250,250,249,.6)", fontSize: 13 }}>
              voltar aos vinhos
            </button>
          </div>
        ) : pour ? (
          <div style={{ textAlign: "center", width: "100%" }}>
            <div style={{ fontSize: 13, color: C.wineSoft, letterSpacing: ".1em", textTransform: "uppercase" }}>
              Vinho {pour.position} de {STUB_EVENT.lineup.length}
            </div>
            <h2 style={{ fontSize: 30, lineHeight: 1.2, margin: "16px 0 6px" }}>{pour.name}</h2>
            <div style={{ fontSize: 16, color: "rgba(250,250,249,.72)" }}>{pour.producer}</div>
            <div style={{ fontSize: 13, color: "rgba(250,250,249,.5)", marginTop: 8 }}>{wineSub(pour)}</div>
            <button onClick={() => setRating(true)}
              style={{ marginTop: 30, padding: "15px 34px", borderRadius: 999, border: impressions[pour.id] ? "1px solid rgba(250,250,249,.4)" : 0,
                background: impressions[pour.id] ? "transparent" : "#fafaf9", color: impressions[pour.id] ? "#fafaf9" : C.ink,
                fontSize: 15, fontWeight: 700 }}>
              {impressions[pour.id] ? "Editar avaliação" : "Avaliar este vinho"}
            </button>
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 20px 34px" }}>
        <button onClick={() => setI((n) => Math.max(0, n - 1))} disabled={i === 0}
          style={navBtn(i === 0)}>← anterior</button>
        <button onClick={() => setI((n) => Math.min(cards - 1, n + 1))} disabled={i === cards - 1}
          style={navBtn(i === cards - 1)}>próximo →</button>
      </div>

      {rating && pour && (
        <RatingStub pour={pour} onClose={() => setRating(false)}
          onRate={() => { rate(pour.id); setRating(false); setI((n) => Math.min(cards - 1, n + 1)); }} />
      )}
    </div>
  );
}

const navBtn = (disabled: boolean): React.CSSProperties => ({
  background: "transparent", border: 0, fontSize: 14,
  color: disabled ? "rgba(250,250,249,.22)" : "rgba(250,250,249,.8)",
});
