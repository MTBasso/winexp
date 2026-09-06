/**
 * PROTOTYPE — throwaway. Ticket 07: three structurally different rating
 * screens, judged inside the real deck.
 *
 *  A — Deslizadores: every axis at once, as sliders with worded ends.
 *  B — Ou/ou:        every axis as a two-way tap. Fastest possible.
 *  C — Uma por vez:  one full-screen question at a time, biggest targets.
 */
import { useState } from "react";
import { AXES, type Impression } from "./content";
import { Descriptors, NoteField } from "./parts";

export const RATING_NAMES = {
  A: "Deslizadores",
  B: "Ou / ou",
  C: "Uma pergunta por vez",
};

export interface RatingProps {
  readonly value: Impression;
  readonly onChange: (next: Impression) => void;
  readonly onDone: () => void;
}

const useToggles = ({ value, onChange }: RatingProps) => ({
  setRating: (id: string, n: number) =>
    onChange({ ...value, ratings: { ...value.ratings, [id]: n } }),
  toggleDescriptor: (d: string) =>
    onChange({
      ...value,
      descriptors: value.descriptors.includes(d)
        ? value.descriptors.filter((x) => x !== d)
        : [...value.descriptors, d],
    }),
  setNote: (note: string) => onChange({ ...value, note }),
});

/* ── A ─────────────────────────────────────────────────────────────────── */
export function RatingSliders(props: RatingProps) {
  const { value, onDone } = props;
  const { setRating, toggleDescriptor, setNote } = useToggles(props);
  return (
    <div style={{ display: "grid", gap: 24 }}>
      {AXES.map((a) => {
        const v = value.ratings[a.id] ?? 3;
        return (
          <div key={a.id}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{a.question}</div>
            <input type="range" min={1} max={5} value={v}
              onChange={(e) => setRating(a.id, Number(e.target.value))}
              style={{ width: "100%", accentColor: "#7f1d1d" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(250,250,249,.55)", marginTop: 2 }}>
              <span>{a.low}</span><span>{a.high}</span>
            </div>
          </div>
        );
      })}
      <Descriptors chosen={value.descriptors} toggle={toggleDescriptor} dark />
      <NoteField note={value.note} setNote={setNote} dark />
      <button onClick={onDone} style={doneBtn}>Pronto</button>
    </div>
  );
}

/* ── B ─────────────────────────────────────────────────────────────────── */
export function RatingBinary(props: RatingProps) {
  const { value, onDone } = props;
  const { setRating, toggleDescriptor, setNote } = useToggles(props);
  return (
    <div style={{ display: "grid", gap: 22 }}>
      {AXES.map((a) => {
        const v = value.ratings[a.id];
        return (
          <div key={a.id}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>{a.question}</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ n: 2, t: a.low }, { n: 4, t: a.high }].map(({ n, t }) => (
                <button key={n} onClick={() => setRating(a.id, n)}
                  style={{
                    flex: 1, padding: "16px 10px", borderRadius: 12, fontSize: 14.5, fontWeight: 600,
                    border: `1px solid ${v === n ? "#7f1d1d" : "rgba(250,250,249,.22)"}`,
                    background: v === n ? "#7f1d1d" : "transparent",
                    color: "#fafaf9",
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      <Descriptors chosen={value.descriptors} toggle={toggleDescriptor} dark />
      <NoteField note={value.note} setNote={setNote} dark />
      <button onClick={onDone} style={doneBtn}>Pronto</button>
    </div>
  );
}

/* ── C ─────────────────────────────────────────────────────────────────── */
export function RatingWizard(props: RatingProps) {
  const { value, onDone } = props;
  const { setRating, toggleDescriptor, setNote } = useToggles(props);
  const [step, setStep] = useState(0);
  const total = AXES.length + 2;
  const axis = AXES[step];

  const next = () => (step >= total - 1 ? onDone() : setStep((s) => s + 1));

  return (
    <div style={{ display: "grid", gap: 20, minHeight: 330, gridTemplateRows: "auto 1fr auto" }}>
      <div style={{ display: "flex", gap: 4 }}>
        {Array.from({ length: total }).map((_, n) => (
          <span key={n} style={{ flex: 1, height: 2.5, borderRadius: 2, background: n <= step ? "#7f1d1d" : "rgba(250,250,249,.18)" }} />
        ))}
      </div>

      <div style={{ display: "grid", alignContent: "center", gap: 18 }}>
        {axis ? (
          <>
            <div style={{ fontSize: 20, fontWeight: 700, textAlign: "center", lineHeight: 1.3 }}>{axis.question}</div>
            <div style={{ display: "flex", gap: 7, justifyContent: "center" }}>
              {[1, 2, 3, 4, 5].map((n) => {
                const on = value.ratings[axis.id] === n;
                return (
                  <button key={n} onClick={() => { setRating(axis.id, n); setTimeout(next, 180); }}
                    style={{
                      width: 54, height: 54, borderRadius: 999, fontSize: 17, fontWeight: 700,
                      border: `1px solid ${on ? "#7f1d1d" : "rgba(250,250,249,.24)"}`,
                      background: on ? "#7f1d1d" : "transparent", color: "#fafaf9",
                    }}>{n}</button>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(250,250,249,.55)" }}>
              <span>{axis.low}</span><span>{axis.high}</span>
            </div>
          </>
        ) : step === AXES.length ? (
          <Descriptors chosen={value.descriptors} toggle={toggleDescriptor} dark />
        ) : (
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>Quer dizer mais alguma coisa?</div>
            <NoteField note={value.note} setNote={setNote} dark />
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        {step > 0 && (
          <button onClick={() => setStep((s) => s - 1)} style={{ ...doneBtn, flex: "0 0 96px", background: "transparent", border: "1px solid rgba(250,250,249,.22)" }}>
            voltar
          </button>
        )}
        <button onClick={next} style={{ ...doneBtn, flex: 1 }}>
          {step >= total - 1 ? "Pronto" : "Continuar"}
        </button>
      </div>
    </div>
  );
}

const doneBtn: React.CSSProperties = {
  width: "100%", padding: 15, borderRadius: 12, border: 0,
  background: "#7f1d1d", color: "#fff", fontSize: 15, fontWeight: 700,
};
