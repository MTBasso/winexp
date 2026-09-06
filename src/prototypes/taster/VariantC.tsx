/** PROTOTYPE — throwaway. Variant C: "Agora" — the wine in your glass fills the screen. */
import { useState } from "react";
import { STUB_EVENT, ratedCount, type Impressions, type StubPour } from "./stubData";
import { C, RatingStub, shareLabel, wineSub } from "./shared";

export const NAME_C = "Agora — o vinho na sua taça";

export function VariantC({
  impressions, rate, firstName, setFirstName, shareReady,
}: {
  impressions: Impressions;
  rate: (id: string) => void;
  firstName: string | null;
  setFirstName: (n: string) => void;
  shareReady: boolean;
}) {
  const [open, setOpen] = useState<StubPour | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const done = ratedCount(impressions);

  const nextUnrated = STUB_EVENT.lineup.find((p) => !impressions[p.id]);
  const focus = STUB_EVENT.lineup.find((p) => p.id === focusId) ?? nextUnrated ?? null;

  return (
    <div style={{ background: C.cream, minHeight: "100vh" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 18px 10px" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{STUB_EVENT.name}</div>
          <div style={{ fontSize: 12, color: C.mut }}>{STUB_EVENT.date} · {done}/{STUB_EVENT.lineup.length}</div>
        </div>
        <button disabled={done === 0 || !shareReady}
          style={{ padding: "9px 15px", borderRadius: 999, border: 0, fontSize: 13, fontWeight: 700,
            background: done > 0 && shareReady ? C.wine : "#e7e5e4", color: done > 0 && shareReady ? "#fff" : C.mut }}>
          {done === 0 ? "—" : shareReady ? `Compartilhar ${done}` : "Preparando…"}
        </button>
      </header>

      {focus ? (
        <section style={{ margin: "10px 16px 0", padding: "30px 22px 26px", background: "#fff", borderRadius: 18, border: `1px solid ${C.line}`, textAlign: "center" }}>
          <div style={{ fontSize: 11.5, letterSpacing: ".12em", textTransform: "uppercase", color: C.gold }}>
            {impressions[focus.id] ? "Já avaliado" : "Sendo servido agora"}
          </div>
          <h1 style={{ fontSize: 27, lineHeight: 1.18, margin: "14px 0 6px", color: C.ink }}>{focus.name}</h1>
          <div style={{ fontSize: 15, color: C.wineSoft, fontWeight: 600 }}>{focus.producer}</div>
          <div style={{ fontSize: 12.5, color: C.mut, marginTop: 8 }}>{wineSub(focus)}</div>
          <button onClick={() => setOpen(focus)}
            style={{ width: "100%", marginTop: 24, padding: 16, borderRadius: 12, border: impressions[focus.id] ? `1px solid ${C.line}` : 0,
              background: impressions[focus.id] ? "#fff" : C.wine, color: impressions[focus.id] ? C.ink : "#fff", fontSize: 15, fontWeight: 700 }}>
            {impressions[focus.id] ? "Editar minha avaliação" : "Avaliar este vinho"}
          </button>
        </section>
      ) : (
        <section style={{ margin: "10px 16px 0", padding: 34, background: "#fff", borderRadius: 18, textAlign: "center", border: `1px solid ${C.line}` }}>
          <div style={{ fontSize: 34 }}>🍷</div>
          <h1 style={{ fontSize: 21, margin: "12px 0 6px" }}>Todos avaliados</h1>
          <p style={{ fontSize: 14, color: C.mut, margin: 0 }}>Você avaliou os {STUB_EVENT.lineup.length} vinhos da noite.</p>
          {!firstName && (
            <input placeholder="Seu primeiro nome (opcional)"
              onKeyDown={(e) => { if (e.key === "Enter") setFirstName((e.target as HTMLInputElement).value); }}
              style={{ width: "100%", marginTop: 16, padding: "12px 14px", border: `1px solid ${C.line}`, borderRadius: 10, fontSize: 15 }} />
          )}
        </section>
      )}

      <button onClick={() => setSheet((s) => !s)}
        style={{ display: "block", width: "calc(100% - 32px)", margin: "14px 16px 0", padding: "13px", borderRadius: 12,
          border: `1px solid ${C.line}`, background: "transparent", color: C.mut, fontSize: 13.5 }}>
        {sheet ? "Esconder a lista" : `Ver todos os ${STUB_EVENT.lineup.length} vinhos`}
      </button>

      {sheet && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "14px 16px 24px" }}>
          {STUB_EVENT.lineup.map((p) => {
            const rated = !!impressions[p.id];
            return (
              <button key={p.id} onClick={() => { setFocusId(p.id); setSheet(false); }}
                style={{ flex: "0 0 132px", textAlign: "left", padding: 12, borderRadius: 12, background: "#fff",
                  border: `1px solid ${p.id === focus?.id ? C.wine : C.line}` }}>
                <span style={{ display: "block", fontSize: 11, color: rated ? C.wine : C.mut, fontWeight: 700 }}>
                  {rated ? "✓ avaliado" : `vinho ${p.position}`}
                </span>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, marginTop: 5, color: C.ink }}>{p.name}</span>
                <span style={{ display: "block", fontSize: 11.5, color: C.mut, marginTop: 2 }}>{p.producer}</span>
              </button>
            );
          })}
        </div>
      )}

      <p style={{ textAlign: "center", fontSize: 12, color: C.mut, padding: "18px 30px 40px", lineHeight: 1.5 }}>
        {shareLabel(shareReady, done) === "Avalie um vinho para começar"
          ? "Avalie o vinho que estiver na sua taça. Pode voltar a qualquer momento."
          : "Pode editar qualquer avaliação até o fim da noite."}
      </p>

      {open && <RatingStub pour={open} onRate={() => { rate(open.id); setOpen(null); setFocusId(null); }} onClose={() => setOpen(null)} />}
    </div>
  );
}
