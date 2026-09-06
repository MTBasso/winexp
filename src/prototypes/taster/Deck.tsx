/**
 * PROTOTYPE — throwaway. The Taster flow settled by ticket 04:
 * B's dark deck + C's live-rating focus + the name asked before the first
 * bottle. `?variant=` now switches ticket 07's rating screen inside it.
 */
import { useState } from "react";
import { STUB_EVENT, type StubPour } from "./stubData";
import { EMPTY_IMPRESSION, isStarted, type Impression } from "./rating/content";
import { RatingBinary } from "./rating/variants";
import { wineSub } from "./shared";

type Impressions = Readonly<Record<string, Impression>>;

export function Deck({
  impressions, setImpressions, firstName, setFirstName, nameAsked, setNameAsked, shareReady,
}: {
  impressions: Impressions;
  setImpressions: (fn: (prev: Impressions) => Impressions) => void;
  firstName: string | null;
  setFirstName: (n: string | null) => void;
  nameAsked: boolean;
  setNameAsked: (b: boolean) => void;
  shareReady: boolean;
}) {
  const lineup = STUB_EVENT.lineup;
  const rated = (p: StubPour) => isStarted(impressions[p.id]);
  const firstUnrated = lineup.findIndex((p) => !rated(p));
  const nowServing = firstUnrated === -1 ? null : lineup[firstUnrated];

  // Card 0 is the name, cards 1..N the Pours, last card the share.
  // On re-entry the deck opens on the Pour being served, not back at the start.
  const [card, setCard] = useState(() =>
    nameAsked ? (firstUnrated === -1 ? lineup.length + 1 : firstUnrated + 1) : 0,
  );
  const [rating, setRating] = useState<StubPour | null>(null);

  const total = lineup.length + 2;
  const pour = card >= 1 && card <= lineup.length ? lineup[card - 1] : undefined;
  const doneCount = lineup.filter(rated).length;

  const update = (id: string, next: Impression) =>
    setImpressions((prev) => ({ ...prev, [id]: next }));

  return (
    <div style={{ background: "#1c1917", minHeight: "100vh", color: "#fafaf9", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", gap: 4, padding: "18px 18px 0" }}>
        {Array.from({ length: total }).map((_, n) => (
          <span key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: n === card ? "#fafaf9" : n < card ? "#a8544f" : "rgba(250,250,249,.2)" }} />
        ))}
      </div>
      <div style={{ padding: "14px 20px 0", fontSize: 12, color: "rgba(250,250,249,.5)" }}>
        {STUB_EVENT.name} · {STUB_EVENT.date}
      </div>

      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: "10px 22px" }}>
        {/* Card 0 — the name, before the first bottle */}
        {card === 0 && (
          <div style={{ width: "100%", maxWidth: 330, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🍷</div>
            <h1 style={{ fontSize: 25, margin: "0 0 8px" }}>Boa noite!</h1>
            <p style={{ fontSize: 14.5, color: "rgba(250,250,249,.66)", lineHeight: 1.5, margin: "0 0 22px" }}>
              São {lineup.length} vinhos esta noite. Avalie cada um quando ele
              chegar na sua taça.
            </p>
            <input autoFocus placeholder="Seu primeiro nome"
              defaultValue={firstName ?? ""}
              onChange={(e) => setFirstName(e.target.value || null)}
              style={{ width: "100%", padding: "14px 15px", borderRadius: 11, border: 0, fontSize: 16, textAlign: "center" }} />
            <div style={{ fontSize: 12, color: "rgba(250,250,249,.45)", margin: "10px 0 20px" }}>
              Só para assinar suas imagens no final.
            </div>
            <button onClick={() => { setNameAsked(true); setCard(1); }}
              style={{ width: "100%", padding: 15, borderRadius: 12, border: 0, background: "#fafaf9", color: "#1c1917", fontSize: 15, fontWeight: 700 }}>
              Começar
            </button>
            <button onClick={() => { setFirstName(null); setNameAsked(true); setCard(1); }}
              style={{ marginTop: 10, background: "transparent", border: 0, color: "rgba(250,250,249,.55)", fontSize: 13 }}>
              prefiro não dizer
            </button>
          </div>
        )}

        {/* Pour cards */}
        {pour && (
          <div style={{ width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 11.5, letterSpacing: ".12em", textTransform: "uppercase", color: pour.id === nowServing?.id ? "#d4a373" : "rgba(250,250,249,.45)" }}>
              {pour.id === nowServing?.id ? "Sendo servido agora" : rated(pour) ? "Já avaliado" : `Vinho ${pour.position}`}
            </div>
            <h2 style={{ fontSize: 29, lineHeight: 1.2, margin: "14px 0 6px" }}>{pour.name}</h2>
            <div style={{ fontSize: 15.5, color: "rgba(250,250,249,.72)" }}>{pour.producer}</div>
            <div style={{ fontSize: 12.5, color: "rgba(250,250,249,.45)", marginTop: 7 }}>{wineSub(pour)}</div>
            <button onClick={() => setRating(pour)}
              style={{
                marginTop: 26, padding: "15px 32px", borderRadius: 999, fontSize: 15, fontWeight: 700,
                border: rated(pour) ? "1px solid rgba(250,250,249,.35)" : 0,
                background: rated(pour) ? "transparent" : "#fafaf9",
                color: rated(pour) ? "#fafaf9" : "#1c1917",
              }}>
              {rated(pour) ? "Editar avaliação" : "Avaliar este vinho"}
            </button>
          </div>
        )}

        {/* Closing card — share */}
        {card === total - 1 && (
          <div style={{ width: "100%", maxWidth: 330, textAlign: "center" }}>
            <h2 style={{ fontSize: 24, margin: "0 0 10px" }}>
              {doneCount === 0 ? "Nenhum vinho avaliado ainda" : `${doneCount} ${doneCount === 1 ? "vinho avaliado" : "vinhos avaliados"}`}
            </h2>
            <p style={{ fontSize: 14, color: "rgba(250,250,249,.6)", lineHeight: 1.5 }}>
              {firstName ? `Suas imagens saem assinadas com "${firstName}".` : "Suas imagens saem sem assinatura."}
            </p>
            <button disabled={doneCount === 0 || !shareReady}
              style={{
                width: "100%", marginTop: 22, padding: 16, borderRadius: 12, border: 0, fontSize: 15, fontWeight: 700,
                background: doneCount > 0 && shareReady ? "#fafaf9" : "rgba(250,250,249,.14)",
                color: doneCount > 0 && shareReady ? "#1c1917" : "rgba(250,250,249,.5)",
              }}>
              {doneCount === 0 ? "Avalie um vinho para começar"
                : shareReady ? `Salvar ${doneCount} ${doneCount === 1 ? "imagem" : "imagens"}` : "Preparando suas imagens…"}
            </button>
            <div style={{ fontSize: 11.5, color: "rgba(250,250,249,.4)", marginTop: 10, lineHeight: 1.5 }}>
              Ticket 12 decide o que vem depois de salvar.
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 20px 32px" }}>
        <button onClick={() => setCard((n) => Math.max(0, n - 1))} disabled={card === 0} style={nav(card === 0)}>← anterior</button>
        <button onClick={() => setCard((n) => Math.min(total - 1, n + 1))} disabled={card === total - 1} style={nav(card === total - 1)}>próximo →</button>
      </div>

      {rating && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(12,10,9,.6)", display: "flex", alignItems: "flex-end", zIndex: 60 }}
             onClick={() => setRating(null)}>
          <div onClick={(e) => e.stopPropagation()}
               style={{ background: "#1c1917", width: "100%", maxHeight: "92vh", overflowY: "auto",
                        borderRadius: "18px 18px 0 0", padding: "20px 20px 30px", border: "1px solid rgba(250,250,249,.12)" }}>
            <div style={{ fontSize: 12, color: "rgba(250,250,249,.5)" }}>Vinho {rating.position}</div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>{rating.name}</div>
            <RatingBinary
              value={impressions[rating.id] ?? EMPTY_IMPRESSION}
              onChange={(next) => update(rating.id, next)}
              onDone={() => {
                setRating(null);
                setCard((n) => Math.min(total - 1, n + 1));
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const nav = (disabled: boolean): React.CSSProperties => ({
  background: "transparent", border: 0, fontSize: 14,
  color: disabled ? "rgba(250,250,249,.2)" : "rgba(250,250,249,.78)",
});
