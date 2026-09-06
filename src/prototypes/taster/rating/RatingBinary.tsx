/**
 * The rating screen settled by ticket 07: "ou / ou".
 *
 * Each Axis is a two-way tap between two plainly worded options. Four taps make
 * a complete Impression; Descriptors and the Note are optional. Deliberately no
 * middle value — the accepted trade recorded on ticket 07.
 */
import { AXES, type Impression } from "./content";
import { Descriptors, NoteField } from "./parts";

export interface RatingProps {
  readonly value: Impression;
  readonly onChange: (next: Impression) => void;
  readonly onDone: () => void;
}

export function RatingBinary({ value, onChange, onDone }: RatingProps) {
  const setRating = (id: string, n: number) =>
    onChange({ ...value, ratings: { ...value.ratings, [id]: n } });

  const toggleDescriptor = (d: string) =>
    onChange({
      ...value,
      descriptors: value.descriptors.includes(d)
        ? value.descriptors.filter((x) => x !== d)
        : [...value.descriptors, d],
    });

  return (
    <div style={{ display: "grid", gap: 22 }}>
      {AXES.map((a) => {
        const v = value.ratings[a.id];
        return (
          <div key={a.id}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>
              {a.question}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ n: 2, t: a.low }, { n: 4, t: a.high }].map(({ n, t }) => (
                <button
                  key={n}
                  onClick={() => setRating(a.id, n)}
                  style={{
                    flex: 1, padding: "16px 10px", borderRadius: 12,
                    fontSize: 14.5, fontWeight: 600, color: "#fafaf9",
                    border: `1px solid ${v === n ? "#7f1d1d" : "rgba(250,250,249,.22)"}`,
                    background: v === n ? "#7f1d1d" : "transparent",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <Descriptors chosen={value.descriptors} toggle={toggleDescriptor} dark />
      <NoteField note={value.note} setNote={(note) => onChange({ ...value, note })} dark />

      <button
        onClick={onDone}
        style={{
          width: "100%", padding: 15, borderRadius: 12, border: 0,
          background: "#7f1d1d", color: "#fff", fontSize: 15, fontWeight: 700,
        }}
      >
        Pronto
      </button>
    </div>
  );
}
