/**
 * PROTOTYPE — C: Lista viva. The Lineup as it will be seen, edited in place.
 * No form, no wizard — tap a line and change it, like editing a document.
 */
import { useState } from "react";
import { O } from "./parts";
import { FakeQr, QrSheet } from "./QrSheet";
import { emptyPour, isPourUsable, newEvent, PAST_EVENTS, type DraftEvent, type DraftPour } from "./model";

export const NAME_LIVE = "Lista viva — edita no lugar";

export function VariantLive() {
  const [ev, setEv] = useState<DraftEvent>(() => ({ ...newEvent(), pours: [] }));
  const [editing, setEditing] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const usable = ev.pours.filter(isPourUsable);

  const patch = (id: string, p: Partial<DraftPour>) =>
    setEv((prev) => ({ ...prev, pours: prev.pours.map((x) => (x.id === id ? { ...x, ...p } : x)) }));

  const add = () => {
    const p = emptyPour();
    setEv((prev) => ({ ...prev, pours: [...prev.pours, p] }));
    setEditing(p.id);
  };

  return (
    <div style={{ background: O.cream, minHeight: "100vh", fontFamily: "system-ui, sans-serif", paddingBottom: 40 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "20px 18px 16px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            value={ev.name} onChange={(e) => setEv((p) => ({ ...p, name: e.target.value }))}
            placeholder="Nome da degustação"
            style={{ width: "100%", border: 0, background: "transparent", fontSize: 21, fontWeight: 700, color: O.ink, padding: 0 }}
          />
          <input
            value={ev.date} onChange={(e) => setEv((p) => ({ ...p, date: e.target.value }))}
            placeholder="Data"
            style={{ width: "100%", border: 0, background: "transparent", fontSize: 13.5, color: O.mut, padding: "3px 0 0" }}
          />
        </div>
        <button onClick={() => setSheet(true)}
          style={{ flex: "0 0 auto", marginLeft: 12, padding: 7, borderRadius: 10, border: `1px solid ${O.line}`, background: "#fff", lineHeight: 0 }}>
          <FakeQr code={ev.code} size={40} />
        </button>
      </header>

      <div style={{ padding: "0 18px" }}>
        {ev.pours.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: O.mut, fontSize: 13.5, lineHeight: 1.6 }}>
            Nenhum vinho ainda.<br />Adicione na ordem em que forem servidos.
          </div>
        )}

        {ev.pours.map((p, i) => {
          const open = editing === p.id;
          return (
            <div key={p.id} style={{ background: "#fff", border: `1px solid ${open ? O.wine : O.line}`, borderRadius: 12, marginBottom: 8, overflow: "hidden" }}>
              <button onClick={() => setEditing(open ? null : p.id)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", background: "transparent", border: 0, textAlign: "left" }}>
                <span style={{ flex: "0 0 26px", height: 26, borderRadius: 999, background: O.wine, color: "#fff", fontSize: 12, fontWeight: 700, display: "grid", placeItems: "center" }}>
                  {i + 1}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: isPourUsable(p) ? O.ink : "#c4bfba" }}>
                    {p.name || p.producer || "Toque para preencher"}
                  </span>
                  {isPourUsable(p) && (
                    <span style={{ display: "block", fontSize: 12, color: O.mut, marginTop: 2 }}>
                      {[p.producer, p.vintage, p.country].filter(Boolean).join(" · ") || "sem detalhes"}
                    </span>
                  )}
                </span>
                <span style={{ color: O.mut, fontSize: 12 }}>{open ? "fechar" : "editar"}</span>
              </button>

              {open && (
                <div style={{ padding: "0 14px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {([
                    ["Nome do vinho", "name", "Douro Tinto", true],
                    ["Produtor", "producer", "Quinta do Crasto", true],
                    ["Safra", "vintage", "2020", false],
                    ["País", "country", "Portugal", false],
                    ["Uva", "grape", "Touriga Nacional", true],
                  ] as const).map(([label, key, ph, wide]) => (
                    <label key={key} style={{ gridColumn: wide ? "1 / -1" : undefined }}>
                      <span style={{ display: "block", fontSize: 11, color: O.mut, marginBottom: 4 }}>{label}</span>
                      <input value={p[key]} onChange={(e) => patch(p.id, { [key]: e.target.value })} placeholder={ph}
                        style={{ width: "100%", padding: "10px 11px", fontSize: 14.5, borderRadius: 8, border: `1px solid ${O.line}` }} />
                    </label>
                  ))}
                  <button onClick={() => { setEv((prev) => ({ ...prev, pours: prev.pours.filter((x) => x.id !== p.id) })); setEditing(null); }}
                    style={{ gridColumn: "1 / -1", padding: 11, borderRadius: 9, border: 0, background: "transparent", color: "#b91c1c", fontSize: 13 }}>
                    remover este vinho
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <button onClick={add}
          style={{ width: "100%", padding: 14, borderRadius: 11, border: `1px dashed ${O.line}`, background: "transparent", color: O.wine, fontSize: 14, fontWeight: 600, marginTop: 4 }}>
          + adicionar vinho
        </button>

        <div style={{ fontSize: 12, color: O.mut, textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
          {usable.length === 0 ? "O QR já funciona, mas a lista está vazia."
            : `${usable.length} ${usable.length === 1 ? "vinho" : "vinhos"} · salvo automaticamente`}
        </div>

        <div style={{ marginTop: 30 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: O.ink, marginBottom: 10 }}>Anteriores</div>
          {PAST_EVENTS.map((e) => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", background: "#fff", border: `1px solid ${O.line}`, borderRadius: 11, marginBottom: 7 }}>
              <span style={{ fontSize: 13.5, color: O.ink }}>{e.name}</span>
              <span style={{ fontSize: 12, color: O.mut }}>{e.date}</span>
            </div>
          ))}
        </div>
      </div>

      {sheet && (
        <div onClick={() => setSheet(false)} style={{ position: "fixed", inset: 0, background: "rgba(28,25,23,.5)", display: "grid", placeItems: "center", padding: 22, zIndex: 60 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 340 }}>
            <QrSheet code={ev.code} eventName={ev.name} date={ev.date} />
            <button style={{ width: "100%", marginTop: 12, padding: 14, borderRadius: 11, border: 0, background: "#fff", fontSize: 14, fontWeight: 700 }}>
              Imprimir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
