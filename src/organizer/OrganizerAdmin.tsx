/**
 * The Organizer admin (ticket 06: "lista viva", ticket 17: for real).
 *
 * Name and date edited in place, the Lineup is the page, rows expand to edit.
 * The QR exists from the moment the Event does — an Event has no states
 * (ticket 05), so there is no publish step to gate it behind.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Event, Pour, Tipo } from "../domain/types";
import {
  ApiError, createEvent, fetchEvent, listEvents, patchEvent, putLineup, uploadPourImage,
  type EventSummary, type PourInput,
} from "../api/client";
import { useAutosave } from "./useAutosave";
import { QrSheet } from "./QrSheet";
import { O, Field, Select, SaveBadge } from "./parts";

type Draft = PourInput & { key: string; imageUrl: string | null };

const TIPO_OPTIONS: readonly { value: Tipo; label: string }[] = [
  { value: "Tinto", label: "Tinto" },
  { value: "Branco", label: "Branco" },
  { value: "Rosé", label: "Rosé" },
  { value: "Espumante", label: "Espumante" },
  { value: "Fortificado", label: "Fortificado" },
  { value: "Outro", label: "Outro" },
];

let seq = 0;
const keyFor = () => `k${(seq += 1)}`;
/**
 * Carries through an existing Pour's real id when editing/copying in place —
 * only `copyFrom` (below) generates fresh ids, because those copies are
 * independent new Pours, not links to the source Event's Pours.
 */
const toDraft = (p: Pour): Draft => ({
  key: keyFor(), id: p.id, position: p.position, name: p.name, producer: p.producer,
  vintage: p.vintage, grape: p.grape, country: p.country, tipo: p.tipo, imageUrl: p.imageUrl,
});
const blankDraft = (): Draft => ({
  // A real id from the start — this is what makes the stable-id backend
  // contract (bottle image upload keyed by Pour id) work.
  key: keyFor(), id: crypto.randomUUID(), position: 0, name: "", producer: "",
  vintage: "", grape: "", country: "", tipo: "Outro", imageUrl: null,
});
const isUsable = (p: Draft) => p.name.trim() !== "" || p.producer.trim() !== "";

export function OrganizerAdmin() {
  const [event, setEvent] = useState<Event | null>(null);
  const [pours, setPours] = useState<Draft[]>([]);
  const [past, setPast] = useState<EventSummary[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedFrom, setCopiedFrom] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const refreshPast = useCallback(() => {
    void listEvents().then((r) => setPast(r.events)).catch(() => setPast([]));
  }, []);
  useEffect(refreshPast, [refreshPast]);

  const lineupSave = useAutosave<Draft[]>(async (next) => {
    if (!event) return;
    await putLineup(
      event.id,
      next.filter(isUsable).map(({ key: _key, imageUrl: _imageUrl, ...p }) => p),
    );
    refreshPast();
  });

  const metaSave = useAutosave<{ name: string; date: string }>(async ({ name, date }) => {
    if (!event) return;
    await patchEvent(event.id, name, date);
    refreshPast();
  });

  const usable = useMemo(() => pours.filter(isUsable), [pours]);

  const updatePours = (next: Draft[]) => {
    setPours(next);
    lineupSave.schedule(next);
  };

  const start = async (name: string, date: string) => {
    setCreating(true);
    setError(null);
    try {
      const created = await createEvent(name, date);
      setEvent(created);
      setPours([]);
      refreshPast();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Não foi possível criar");
    } finally {
      setCreating(false);
    }
  };

  /**
   * Ticket 17: copy a past Lineup into this Event as a starting point.
   *
   * A plain copy with fresh ids, not a link — a Pour already carries its own
   * wine details, so the copies are independent and editing this month's Douro
   * cannot rewrite last month's.
   */
  const copyFrom = async (summary: EventSummary) => {
    setError(null);
    try {
      const source = await fetchEvent(summary.code);
      // Fresh ids, and no carried-over image: these are independent new
      // Pours, not links to the source Event's Pours.
      const copied = source.lineup.map((p) => ({ ...toDraft(p), id: crypto.randomUUID(), imageUrl: null }));
      const next = [...pours.filter(isUsable), ...copied].map((p, i) => ({ ...p, position: i + 1 }));
      updatePours(next);
      setCopiedFrom(summary.name);
      setTimeout(() => setCopiedFrom(null), 4000);
    } catch {
      setError("Não foi possível copiar essa lista");
    }
  };

  /** Ticket: access by link. Text-only share, no file-share decode risk. */
  const shareLink = async (ev: Event) => {
    const url = `${window.location.origin}/e/${ev.code}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ url, title: ev.name });
        return;
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return; // dismissed; not a failure
        // fall through to clipboard copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 4000);
    } catch {
      setError("Não foi possível copiar o link");
    }
  };

  /** Bottle photo upload — immediate, not part of the autosaved Lineup fields. */
  const uploadImage = async (p: Draft, file: File) => {
    if (!event) return;
    setImageError(null);
    if (file.type !== "image/png") {
      setImageError("Envie um arquivo PNG.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setImageError("A imagem deve ter até 8MB.");
      return;
    }
    try {
      // The Pour's row may not exist in D1 yet if it was just added — wait
      // out (or force) the debounced Lineup save first so the image upload
      // doesn't race the row's own creation.
      await lineupSave.flush();
      await uploadPourImage(event.code, p.id, file);
      // Local-only update (not scheduled through lineupSave — the upload is
      // its own immediate action, not part of the autosaved text fields).
      setPours((prev) => prev.map((x) => (x.key === p.key ? { ...x, imageUrl: URL.createObjectURL(file) } : x)));
    } catch (e) {
      setImageError(e instanceof ApiError ? e.message : "Não foi possível enviar a imagem");
    }
  };

  if (!event) {
    return (
      <NewEvent
        busy={creating}
        error={error}
        past={past}
        onStart={start}
        onOpen={async (s) => {
          try {
            const full = await fetchEvent(s.code);
            setEvent(full);
            setPours(full.lineup.map(toDraft));
          } catch {
            setError("Não foi possível abrir essa degustação");
          }
        }}
      />
    );
  }

  const move = (from: number, delta: number) => {
    const to = from + delta;
    const next = [...pours];
    const a = next[from];
    const b = next[to];
    if (!a || !b) return;
    next[from] = b;
    next[to] = a;
    updatePours(next.map((p, i) => ({ ...p, position: i + 1 })));
  };

  return (
    <div style={{ background: O.cream, minHeight: "100vh", fontFamily: "system-ui, sans-serif", paddingBottom: 60 }}>
      <header style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "20px 18px 14px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            value={event.name}
            onChange={(e) => {
              const name = e.target.value;
              setEvent({ ...event, name });
              metaSave.schedule({ name, date: event.date });
            }}
            placeholder="Nome da degustação"
            style={{ width: "100%", border: 0, background: "transparent", fontSize: 21, fontWeight: 700, color: O.ink, padding: 0 }}
          />
          <input
            value={event.date}
            onChange={(e) => {
              const date = e.target.value;
              setEvent({ ...event, date });
              metaSave.schedule({ name: event.name, date });
            }}
            placeholder="Data"
            style={{ width: "100%", border: 0, background: "transparent", fontSize: 13.5, color: O.mut, padding: "3px 0 0" }}
          />
        </div>
        <button onClick={() => void shareLink(event)} style={shareBtn}>
          <span style={{ fontSize: 16 }}>↗</span>
          <span style={{ fontSize: 10, letterSpacing: ".04em" }}>link</span>
        </button>
        <button onClick={() => setShowQr(true)} style={qrBtn}>
          <span style={{ fontSize: 20 }}>⌗</span>
          <span style={{ fontSize: 10, letterSpacing: ".08em" }}>{event.code}</span>
        </button>
      </header>

      <div style={{ padding: "0 18px 10px" }}>
        <SaveBadge lineup={lineupSave.state} meta={metaSave.state} />
      </div>

      {linkCopied && (
        <div style={{ padding: "0 18px 10px" }}>
          <div style={{ padding: "11px 13px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: 13, color: "#166534" }}>
            Link copiado.
          </div>
        </div>
      )}

      <div style={{ padding: "0 18px" }}>
        {pours.length === 0 && (
          <div style={{ textAlign: "center", padding: "30px 20px", color: O.mut, fontSize: 13.5, lineHeight: 1.6 }}>
            Nenhum vinho ainda.<br />Adicione na ordem em que forem servidos —
            ou copie de uma degustação anterior.
          </div>
        )}

        {pours.map((p, i) => {
          const open = editing === p.key;
          return (
            <div key={p.key} style={{ background: "#fff", border: `1px solid ${open ? O.wine : O.line}`, borderRadius: 12, marginBottom: 8, overflow: "hidden" }}>
              <button onClick={() => setEditing(open ? null : p.key)} style={rowBtn}>
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt="" style={rowThumb} />
                ) : (
                  <span style={numBadge}>{i + 1}</span>
                )}
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: isUsable(p) ? O.ink : "#c4bfba" }}>
                    {p.name || p.producer || "Toque para preencher"}
                  </span>
                  {isUsable(p) && (
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
                  ] as const).map(([label, field, ph, wide]) => (
                    <Field
                      key={field} label={label} placeholder={ph} wide={wide} value={p[field]}
                      onChange={(v) => updatePours(pours.map((x) => (x.key === p.key ? { ...x, [field]: v } : x)))}
                    />
                  ))}
                  <Select
                    label="Tipo" value={p.tipo} options={TIPO_OPTIONS}
                    onChange={(v) => updatePours(pours.map((x) => (x.key === p.key ? { ...x, tipo: v } : x)))}
                  />

                  <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
                    {p.imageUrl && <img src={p.imageUrl} alt="" style={previewThumb} />}
                    <label style={fileLabel}>
                      {p.imageUrl ? "Trocar foto" : "Adicionar foto"}
                      <input
                        type="file"
                        accept="image/png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (file) void uploadImage(p, file);
                        }}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>
                  {imageError && editing === p.key && (
                    <div style={{ gridColumn: "1 / -1", padding: "10px 12px", borderRadius: 9, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 12.5, color: "#b91c1c" }}>
                      {imageError}
                    </div>
                  )}

                  <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                    <button disabled={i === 0} onClick={() => move(i, -1)} style={moveBtn(i === 0)}>↑ subir</button>
                    <button disabled={i === pours.length - 1} onClick={() => move(i, 1)} style={moveBtn(i === pours.length - 1)}>↓ descer</button>
                    <span style={{ flex: 1 }} />
                    <button
                      onClick={() => {
                        updatePours(pours.filter((x) => x.key !== p.key).map((x, n) => ({ ...x, position: n + 1 })));
                        setEditing(null);
                      }}
                      style={{ padding: "9px 12px", borderRadius: 9, border: 0, background: "transparent", color: "#b91c1c", fontSize: 13 }}
                    >
                      remover
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <button
          onClick={() => {
            const next = [...pours, blankDraft()].map((p, i) => ({ ...p, position: i + 1 }));
            setPours(next);
            setEditing(next[next.length - 1]?.key ?? null);
          }}
          style={addBtn}
        >
          + adicionar vinho
        </button>

        {past.filter((e) => e.id !== event.id && e.pour_count > 0).length > 0 && (
          <div style={{ marginTop: 26 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: O.ink, marginBottom: 4 }}>
              Copiar de uma anterior
            </div>
            <div style={{ fontSize: 12, color: O.mut, marginBottom: 10, lineHeight: 1.5 }}>
              Traz os vinhos como ponto de partida. Editar aqui não muda a degustação antiga.
            </div>
            {past.filter((e) => e.id !== event.id && e.pour_count > 0).map((e) => (
              <button key={e.id} onClick={() => void copyFrom(e)} style={pastBtn}>
                <span>
                  <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: O.ink }}>{e.name}</span>
                  <span style={{ display: "block", fontSize: 12, color: O.mut, marginTop: 2 }}>
                    {e.date} · {e.pour_count} {e.pour_count === 1 ? "vinho" : "vinhos"}
                  </span>
                </span>
                <span style={{ fontSize: 12, color: O.wine, fontWeight: 600 }}>copiar</span>
              </button>
            ))}
          </div>
        )}

        {copiedFrom && (
          <div style={{ marginTop: 12, padding: "11px 13px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: 13, color: "#166534" }}>
            Vinhos de “{copiedFrom}” adicionados. Edite à vontade.
          </div>
        )}

        {error && (
          <div style={{ marginTop: 12, padding: "11px 13px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 13, color: "#b91c1c" }}>
            {error}
          </div>
        )}

        <div style={{ fontSize: 12, color: O.mut, textAlign: "center", marginTop: 22, lineHeight: 1.6 }}>
          {usable.length === 0
            ? "O QR já funciona, mas a lista está vazia."
            : `${usable.length} ${usable.length === 1 ? "vinho" : "vinhos"} nesta degustação.`}
        </div>
      </div>

      {showQr && (
        <div onClick={() => setShowQr(false)} style={modal}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 340 }} className="qr-modal">
            <QrSheet code={event.code} name={event.name} date={event.date} />
            <button onClick={() => window.print()} style={printBtn} className="no-print">
              Imprimir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NewEvent({
  busy, error, past, onStart, onOpen,
}: {
  busy: boolean;
  error: string | null;
  past: EventSummary[];
  onStart: (name: string, date: string) => void;
  onOpen: (e: EventSummary) => void;
}) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const ready = name.trim() !== "" && date.trim() !== "";

  return (
    <div style={{ background: O.cream, minHeight: "100vh", fontFamily: "system-ui, sans-serif", padding: "26px 18px 60px" }}>
      <h1 style={{ fontSize: 21, margin: "0 0 6px", color: O.ink }}>Nova degustação</h1>
      <p style={{ fontSize: 13.5, color: O.mut, margin: "0 0 20px", lineHeight: 1.5 }}>
        Nome e data. Os vinhos entram depois — e dá para copiar de uma anterior.
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        <Field label="Nome do evento" value={name} onChange={setName} placeholder="Douro, casa da Ana" wide />
        <Field label="Data" value={date} onChange={setDate} placeholder="6 de setembro" wide />
      </div>

      <button
        onClick={() => onStart(name.trim(), date.trim())}
        disabled={!ready || busy}
        style={{
          width: "100%", marginTop: 16, padding: 16, borderRadius: 12, border: 0,
          fontSize: 15, fontWeight: 700,
          background: ready ? O.wine : O.line, color: ready ? "#fff" : O.mut,
        }}
      >
        {busy ? "Criando…" : "Criar degustação"}
      </button>

      {error && (
        <div style={{ marginTop: 12, padding: "11px 13px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 13, color: "#b91c1c" }}>
          {error}
        </div>
      )}

      {past.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: O.ink, marginBottom: 10 }}>Anteriores</div>
          {past.map((e) => (
            <button key={e.id} onClick={() => onOpen(e)} style={pastBtn}>
              <span>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: O.ink }}>{e.name}</span>
                <span style={{ display: "block", fontSize: 12, color: O.mut, marginTop: 2 }}>
                  {e.date} · {e.pour_count} {e.pour_count === 1 ? "vinho" : "vinhos"} · {e.code}
                </span>
              </span>
              <span style={{ fontSize: 12, color: O.wine, fontWeight: 600 }}>abrir</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const qrBtn: React.CSSProperties = {
  flex: "0 0 auto", display: "grid", placeItems: "center", gap: 2,
  padding: "8px 12px", borderRadius: 10, border: `1px solid ${O.line}`,
  background: "#fff", color: O.ink, fontFamily: "ui-monospace, monospace",
};
const shareBtn: React.CSSProperties = {
  flex: "0 0 auto", display: "grid", placeItems: "center", gap: 2,
  padding: "8px 12px", borderRadius: 10, border: `1px solid ${O.line}`,
  background: "#fff", color: O.ink,
};
const rowBtn: React.CSSProperties = {
  width: "100%", display: "flex", alignItems: "center", gap: 12,
  padding: "13px 14px", background: "transparent", border: 0, textAlign: "left",
};
const numBadge: React.CSSProperties = {
  flex: "0 0 26px", height: 26, borderRadius: 999, background: O.wine,
  color: "#fff", fontSize: 12, fontWeight: 700, display: "grid", placeItems: "center",
};
const rowThumb: React.CSSProperties = {
  flex: "0 0 26px", width: 26, height: 26, borderRadius: 7, objectFit: "cover",
  border: `1px solid ${O.line}`,
};
const previewThumb: React.CSSProperties = {
  flex: "0 0 48px", width: 48, height: 48, borderRadius: 9, objectFit: "cover",
  border: `1px solid ${O.line}`,
};
const fileLabel: React.CSSProperties = {
  padding: "9px 12px", borderRadius: 9, border: `1px solid ${O.line}`,
  background: "#fff", color: O.wine, fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const addBtn: React.CSSProperties = {
  width: "100%", padding: 14, borderRadius: 11, border: `1px dashed ${O.line}`,
  background: "transparent", color: O.wine, fontSize: 14, fontWeight: 600, marginTop: 4,
};
const pastBtn: React.CSSProperties = {
  width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "12px 14px", background: "#fff", border: `1px solid ${O.line}`,
  borderRadius: 11, marginBottom: 7, textAlign: "left",
};
const moveBtn = (disabled: boolean): React.CSSProperties => ({
  padding: "9px 12px", borderRadius: 9, fontSize: 13,
  border: `1px solid ${O.line}`, background: "#fff", color: disabled ? "#d6d3d1" : O.mut,
});
const modal: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(28,25,23,.5)",
  display: "grid", placeItems: "center", padding: 22, zIndex: 60,
};
const printBtn: React.CSSProperties = {
  width: "100%", marginTop: 12, padding: 14, borderRadius: 11, border: 0,
  background: "#fff", fontSize: 14, fontWeight: 700,
};
