/**
 * The Taster deck (ticket 04).
 *
 * Card 0 asks the first name before the first bottle; one card per Pour; a
 * closing card carries sharing. On re-entry the deck opens on the Pour being
 * served rather than back at the start.
 */
import { useState } from "react";
import type { Event, Impression, Pour, Tasting } from "../domain/types";
import { isStarted, ratedCount } from "./tasting";
import { RatingSheet, type RatingChange } from "./RatingSheet";
import { ShareCard } from "../carousel/ShareCard";

export function Deck({
  event, tasting, onName, onRate,
}: {
  event: Event;
  tasting: Tasting;
  onName: (name: string | null) => void;
  onRate: (pour: Pour, change: RatingChange) => void;
}) {
  const lineup = event.lineup;
  const rated = (p: Pour) => isStarted(tasting.impressions[p.id]);
  const firstUnrated = lineup.findIndex((p) => !rated(p));
  const nowServing = firstUnrated === -1 ? null : lineup[firstUnrated];
  const nameAnswered = tasting.firstName !== null || ratedCount(tasting) > 0;

  const [card, setCard] = useState(() =>
    nameAnswered ? (firstUnrated === -1 ? lineup.length + 1 : firstUnrated + 1) : 0,
  );
  const [nameDraft, setNameDraft] = useState(tasting.firstName ?? "");
  const [rating, setRating] = useState<Pour | null>(null);

  const total = lineup.length + 2;
  const pour = card >= 1 && card <= lineup.length ? lineup[card - 1] : undefined;
  const impression: Impression | undefined = rating ? tasting.impressions[rating.id] : undefined;

  return (
    <div style={page}>
      <div style={{ display: "flex", gap: 4, padding: "18px 18px 0" }}>
        {Array.from({ length: total }).map((_, n) => (
          <span key={n} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: n === card ? "#fafaf9" : n < card ? "#a8544f" : "rgba(250,250,249,.2)",
          }} />
        ))}
      </div>
      <div style={{ padding: "14px 20px 0", fontSize: 12, color: "rgba(250,250,249,.5)" }}>
        {event.name} · {event.date}
      </div>

      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: "10px 22px" }}>
        {card === 0 && (
          <div style={{ width: "100%", maxWidth: 330, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🍷</div>
            <h1 style={{ fontSize: 25, margin: "0 0 8px" }}>Boa noite!</h1>
            <p style={{ fontSize: 14.5, color: "rgba(250,250,249,.66)", lineHeight: 1.5, margin: "0 0 22px" }}>
              São {lineup.length} {lineup.length === 1 ? "vinho" : "vinhos"} esta noite.
              Avalie cada um quando ele chegar na sua taça.
            </p>
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Seu primeiro nome"
              style={{ width: "100%", padding: "14px 15px", borderRadius: 11, border: 0, fontSize: 16, textAlign: "center" }}
            />
            <div style={{ fontSize: 12, color: "rgba(250,250,249,.45)", margin: "10px 0 20px" }}>
              Só para assinar suas imagens no final.
            </div>
            <button onClick={() => { onName(nameDraft.trim() || null); setCard(1); }} style={lightBtn}>
              Começar
            </button>
            <button onClick={() => { onName(null); setCard(1); }} style={ghostBtn}>
              prefiro não dizer
            </button>
          </div>
        )}

        {pour && (
          <div style={{ width: "100%", textAlign: "center" }}>
            <div style={{
              fontSize: 11.5, letterSpacing: ".12em", textTransform: "uppercase",
              color: pour.id === nowServing?.id ? "#d4a373" : "rgba(250,250,249,.45)",
            }}>
              {pour.id === nowServing?.id ? "Sendo servido agora" : rated(pour) ? "Já avaliado" : `Vinho ${pour.position}`}
            </div>
            <h2 style={{ fontSize: 29, lineHeight: 1.2, margin: "14px 0 6px" }}>{pour.name}</h2>
            {pour.producer && <div style={{ fontSize: 15.5, color: "rgba(250,250,249,.72)" }}>{pour.producer}</div>}
            <div style={{ fontSize: 12.5, color: "rgba(250,250,249,.45)", marginTop: 7 }}>
              {[pour.vintage, pour.grape, pour.country].filter(Boolean).join(" · ")}
            </div>
            <button
              onClick={() => setRating(pour)}
              style={{
                marginTop: 26, padding: "15px 32px", borderRadius: 999, fontSize: 15, fontWeight: 700,
                border: rated(pour) ? "1px solid rgba(250,250,249,.35)" : 0,
                background: rated(pour) ? "transparent" : "#fafaf9",
                color: rated(pour) ? "#fafaf9" : "#1c1917",
              }}
            >
              {rated(pour) ? "Editar avaliação" : "Avaliar este vinho"}
            </button>
          </div>
        )}

        {card === total - 1 && <ShareCard event={event} tasting={tasting} />}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 20px 32px" }}>
        <button onClick={() => setCard((n) => Math.max(0, n - 1))} disabled={card === 0} style={nav(card === 0)}>
          ← anterior
        </button>
        <button onClick={() => setCard((n) => Math.min(total - 1, n + 1))} disabled={card === total - 1} style={nav(card === total - 1)}>
          próximo →
        </button>
      </div>

      {rating && (
        <RatingSheet
          pour={rating}
          impression={impression}
          onChange={(change) => onRate(rating, change)}
          onClose={() => setRating(null)}
          onDone={() => { setRating(null); setCard((n) => Math.min(total - 1, n + 1)); }}
        />
      )}
    </div>
  );
}

const page: React.CSSProperties = {
  background: "#1c1917", minHeight: "100vh", color: "#fafaf9",
  display: "flex", flexDirection: "column", fontFamily: "system-ui, sans-serif",
};
const lightBtn: React.CSSProperties = {
  width: "100%", padding: 15, borderRadius: 12, border: 0,
  background: "#fafaf9", color: "#1c1917", fontSize: 15, fontWeight: 700,
};
const ghostBtn: React.CSSProperties = {
  marginTop: 10, background: "transparent", border: 0,
  color: "rgba(250,250,249,.55)", fontSize: 13,
};
const nav = (disabled: boolean): React.CSSProperties => ({
  background: "transparent", border: 0, fontSize: 14,
  color: disabled ? "rgba(250,250,249,.2)" : "rgba(250,250,249,.78)",
});
