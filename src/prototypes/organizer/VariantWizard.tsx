/** PROTOTYPE — B: Assistente. One thing per screen, ending on the printable QR. */
import { useState } from "react";
import { O, Field } from "./parts";
import { QrSheet } from "./QrSheet";
import { emptyPour, isPourUsable, newEvent, type DraftEvent, type DraftPour } from "./model";

export const NAME_WIZARD = "Assistente — um passo por vez";

export function VariantWizard() {
  const [step, setStep] = useState(0);
  const [ev, setEv] = useState<DraftEvent>(newEvent);
  const [draft, setDraft] = useState<DraftPour>(emptyPour);

  const usable = ev.pours.filter(isPourUsable);
  const canStep0 = ev.name.trim() && ev.date.trim();

  const addPour = () => {
    if (!isPourUsable(draft)) return;
    setEv((p) => ({ ...p, pours: [...p.pours, draft] }));
    setDraft(emptyPour());
  };

  return (
    <div style={{ background: O.cream, minHeight: "100vh", fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", gap: 5, padding: "18px 18px 0" }}>
        {["Evento", "Vinhos", "QR"].map((t, n) => (
          <div key={t} style={{ flex: 1 }}>
            <div style={{ height: 3, borderRadius: 2, background: n <= step ? O.wine : O.line }} />
            <div style={{ fontSize: 11, color: n === step ? O.wine : O.mut, marginTop: 6, fontWeight: n === step ? 700 : 400 }}>{t}</div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, padding: "26px 18px 0" }}>
        {step === 0 && (
          <>
            <h1 style={{ fontSize: 21, margin: "0 0 6px", color: O.ink }}>Sobre a degustação</h1>
            <p style={{ fontSize: 13.5, color: O.mut, margin: "0 0 22px", lineHeight: 1.5 }}>
              Só o essencial. Dá para mudar depois.
            </p>
            <div style={{ display: "grid", gap: 14 }}>
              <Field label="Nome do evento" value={ev.name} onChange={(name) => setEv((p) => ({ ...p, name }))} placeholder="Douro, casa da Ana" />
              <Field label="Data" value={ev.date} onChange={(date) => setEv((p) => ({ ...p, date }))} placeholder="6 de setembro" />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 style={{ fontSize: 21, margin: "0 0 6px", color: O.ink }}>Os vinhos</h1>
            <p style={{ fontSize: 13.5, color: O.mut, margin: "0 0 20px", lineHeight: 1.5 }}>
              Um de cada vez, na ordem em que serão servidos. {usable.length > 0 && `${usable.length} até agora.`}
            </p>

            {usable.length > 0 && (
              <ol style={{ margin: "0 0 20px", padding: 0, listStyle: "none", display: "grid", gap: 7 }}>
                {usable.map((p, i) => (
                  <li key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", border: `1px solid ${O.line}`, borderRadius: 10, padding: "11px 13px" }}>
                    <span style={{ fontSize: 13.5, color: O.ink }}>
                      <b style={{ color: O.wine, marginRight: 8 }}>{i + 1}</b>
                      {p.name || p.producer}
                    </span>
                    <button onClick={() => setEv((prev) => ({ ...prev, pours: prev.pours.filter((x) => x.id !== p.id) }))}
                      style={{ border: 0, background: "transparent", color: "#b91c1c", fontSize: 16 }}>×</button>
                  </li>
                ))}
              </ol>
            )}

            <div style={{ background: "#fff", border: `1px solid ${O.line}`, borderRadius: 12, padding: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field wide label="Nome do vinho" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} placeholder="Douro Tinto" />
              <Field wide label="Produtor" value={draft.producer} onChange={(v) => setDraft((d) => ({ ...d, producer: v }))} placeholder="Quinta do Crasto" />
              <Field label="Safra" value={draft.vintage} onChange={(v) => setDraft((d) => ({ ...d, vintage: v }))} placeholder="2020" />
              <Field label="País" value={draft.country} onChange={(v) => setDraft((d) => ({ ...d, country: v }))} placeholder="Portugal" />
              <Field wide label="Uva" value={draft.grape} onChange={(v) => setDraft((d) => ({ ...d, grape: v }))} placeholder="Touriga Nacional" />
              <button onClick={addPour} disabled={!isPourUsable(draft)}
                style={{ gridColumn: "1 / -1", padding: 13, borderRadius: 10, border: 0, marginTop: 2,
                  background: isPourUsable(draft) ? O.ink : O.line, color: isPourUsable(draft) ? "#fff" : O.mut, fontSize: 14, fontWeight: 700 }}>
                + adicionar à lista
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 style={{ fontSize: 21, margin: "0 0 6px", color: O.ink }}>Pronto</h1>
            <p style={{ fontSize: 13.5, color: O.mut, margin: "0 0 20px", lineHeight: 1.5 }}>
              Imprima e deixe na mesa. Cada pessoa aponta a câmera.
            </p>
            <QrSheet code={ev.code} eventName={ev.name} date={ev.date} />
            <button style={{ width: "100%", marginTop: 12, padding: 14, borderRadius: 11, border: `1px solid ${O.line}`, background: "#fff", fontSize: 14, fontWeight: 700 }}>
              Imprimir
            </button>
          </>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, padding: "18px" }}>
        {step > 0 && (
          <button onClick={() => setStep((s) => s - 1)} style={{ flex: "0 0 100px", padding: 15, borderRadius: 11, border: `1px solid ${O.line}`, background: "transparent", color: O.mut, fontSize: 14 }}>
            voltar
          </button>
        )}
        {step < 2 && (
          <button onClick={() => setStep((s) => s + 1)} disabled={step === 0 ? !canStep0 : usable.length === 0}
            style={{ flex: 1, padding: 15, borderRadius: 11, border: 0, fontSize: 15, fontWeight: 700,
              background: (step === 0 ? canStep0 : usable.length > 0) ? O.wine : O.line,
              color: (step === 0 ? canStep0 : usable.length > 0) ? "#fff" : O.mut }}>
            Continuar
          </button>
        )}
      </div>
    </div>
  );
}
