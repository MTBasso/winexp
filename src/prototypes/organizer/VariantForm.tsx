/** PROTOTYPE — A: Formulário. One scrolling page, everything visible at once. */
import { useState } from "react";
import { O, Field } from "./parts";
import { QrSheet } from "./QrSheet";
import { emptyPour, isEventUsable, isPourUsable, newEvent, PAST_EVENTS, type DraftEvent } from "./model";

export const NAME_FORM = "Formulário — tudo numa página";

export function VariantForm() {
  const [ev, setEv] = useState<DraftEvent>(() => ({ ...newEvent(), pours: [emptyPour()] }));
  const [showQr, setShowQr] = useState(false);
  const set = (patch: Partial<DraftEvent>) => setEv((p) => ({ ...p, ...patch }));
  const setPour = (id: string, patch: Partial<ReturnType<typeof emptyPour>>) =>
    setEv((p) => ({ ...p, pours: p.pours.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));

  return (
    <div style={{ background: O.cream, minHeight: "100vh", fontFamily: "system-ui, sans-serif", paddingBottom: 100 }}>
      <header style={{ padding: "22px 18px 14px", borderBottom: `1px solid ${O.line}` }}>
        <h1 style={{ fontSize: 20, margin: 0, color: O.ink }}>Nova degustação</h1>
        <div style={{ fontSize: 12.5, color: O.mut, marginTop: 4 }}>
          Preencha e gere o QR. Dá para editar depois, inclusive durante o evento.
        </div>
      </header>

      <section style={{ padding: "18px 18px 0", display: "grid", gap: 12 }}>
        <Field label="Nome do evento" value={ev.name} onChange={(name) => set({ name })} placeholder="Douro, casa da Ana" />
        <Field label="Data" value={ev.date} onChange={(date) => set({ date })} placeholder="6 de setembro" />
      </section>

      <section style={{ padding: "22px 18px 0" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: O.ink, marginBottom: 10 }}>
          Vinhos ({ev.pours.filter(isPourUsable).length})
        </div>

        {ev.pours.map((p, i) => (
          <div key={p.id} style={{ background: "#fff", border: `1px solid ${O.line}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: O.wine }}>Vinho {i + 1}</span>
              <span style={{ display: "flex", gap: 4 }}>
                <button disabled={i === 0} onClick={() => setEv((prev) => {
                  const pours = [...prev.pours]; const a = pours[i - 1]!; pours[i - 1] = pours[i]!; pours[i] = a;
                  return { ...prev, pours };
                })} style={iconBtn(i === 0)}>↑</button>
                <button disabled={i === ev.pours.length - 1} onClick={() => setEv((prev) => {
                  const pours = [...prev.pours]; const a = pours[i + 1]!; pours[i + 1] = pours[i]!; pours[i] = a;
                  return { ...prev, pours };
                })} style={iconBtn(i === ev.pours.length - 1)}>↓</button>
                <button onClick={() => setEv((prev) => ({ ...prev, pours: prev.pours.filter((x) => x.id !== p.id) }))}
                  style={{ ...iconBtn(false), color: "#b91c1c" }}>×</button>
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field wide label="Nome do vinho" value={p.name} onChange={(v) => setPour(p.id, { name: v })} placeholder="Douro Tinto" />
              <Field wide label="Produtor" value={p.producer} onChange={(v) => setPour(p.id, { producer: v })} placeholder="Quinta do Crasto" />
              <Field label="Safra" value={p.vintage} onChange={(v) => setPour(p.id, { vintage: v })} placeholder="2020" />
              <Field label="País" value={p.country} onChange={(v) => setPour(p.id, { country: v })} placeholder="Portugal" />
              <Field wide label="Uva" value={p.grape} onChange={(v) => setPour(p.id, { grape: v })} placeholder="Touriga Nacional" />
            </div>
          </div>
        ))}

        <button onClick={() => setEv((p) => ({ ...p, pours: [...p.pours, emptyPour()] }))}
          style={{ width: "100%", padding: 14, borderRadius: 11, border: `1px dashed ${O.line}`, background: "transparent", color: O.wine, fontSize: 14, fontWeight: 600 }}>
          + adicionar vinho
        </button>
      </section>

      <section style={{ padding: "26px 18px 0" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: O.ink, marginBottom: 10 }}>Degustações anteriores</div>
        {PAST_EVENTS.map((e) => (
          <div key={e.id} style={{ display: "flex", justifyContent: "space-between", padding: "13px 14px", background: "#fff", border: `1px solid ${O.line}`, borderRadius: 11, marginBottom: 8 }}>
            <span>
              <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: O.ink }}>{e.name}</span>
              <span style={{ display: "block", fontSize: 12, color: O.mut, marginTop: 2 }}>{e.date} · {e.pourCount} vinhos</span>
            </span>
            <span style={{ fontSize: 12, color: O.wine, alignSelf: "center" }}>QR</span>
          </div>
        ))}
      </section>

      {showQr && (
        <div onClick={() => setShowQr(false)} style={{ position: "fixed", inset: 0, background: "rgba(28,25,23,.5)", display: "grid", placeItems: "center", padding: 22, zIndex: 60 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 340 }}>
            <QrSheet code={ev.code} eventName={ev.name} date={ev.date} />
            <button style={{ width: "100%", marginTop: 12, padding: 14, borderRadius: 11, border: 0, background: "#fff", fontSize: 14, fontWeight: 700 }}>
              Imprimir
            </button>
          </div>
        </div>
      )}

      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, padding: "12px 18px 20px", background: "linear-gradient(transparent, #faf7f2 25%)" }}>
        <button disabled={!isEventUsable(ev)} onClick={() => setShowQr(true)}
          style={{ width: "100%", padding: 16, borderRadius: 12, border: 0, fontSize: 15, fontWeight: 700,
            background: isEventUsable(ev) ? O.wine : O.line, color: isEventUsable(ev) ? "#fff" : O.mut }}>
          {isEventUsable(ev) ? "Gerar QR da degustação" : "Falta nome, data ou vinho"}
        </button>
      </div>
    </div>
  );
}

const iconBtn = (disabled: boolean): React.CSSProperties => ({
  width: 30, height: 30, borderRadius: 8, border: `1px solid ${O.line}`,
  background: "#fff", color: disabled ? "#d6d3d1" : O.mut, fontSize: 14,
});
