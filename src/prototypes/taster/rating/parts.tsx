/** PROTOTYPE — throwaway. Pieces the three rating variants share. */
import {
  DESCRIPTORS, MAX_DESCRIPTORS, NOTE_MAX_GRAPHEMES, countGraphemes,
} from "./content";

export function Descriptors({
  chosen, toggle, dark,
}: { chosen: readonly string[]; toggle: (d: string) => void; dark?: boolean }) {
  const full = chosen.length >= MAX_DESCRIPTORS;
  return (
    <div>
      <div style={{ fontSize: 13, color: dark ? "rgba(250,250,249,.6)" : "#78716c", marginBottom: 10 }}>
        Lembra de algum sabor? Toque em até {MAX_DESCRIPTORS}.
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {DESCRIPTORS.map((d) => {
          const on = chosen.includes(d);
          const dim = full && !on;
          return (
            <button key={d} onClick={() => toggle(d)} disabled={dim}
              style={{
                padding: "8px 13px", borderRadius: 999, fontSize: 13,
                border: `1px solid ${on ? "#7f1d1d" : dark ? "rgba(250,250,249,.22)" : "#e7e5e4"}`,
                background: on ? "#7f1d1d" : "transparent",
                color: on ? "#fff" : dim ? (dark ? "rgba(250,250,249,.25)" : "#d6d3d1") : dark ? "#fafaf9" : "#1c1917",
              }}>
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function NoteField({
  note, setNote, dark,
}: { note: string; setNote: (s: string) => void; dark?: boolean }) {
  const used = countGraphemes(note);
  const over = used > NOTE_MAX_GRAPHEMES;
  return (
    <div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="Em poucas palavras, o que achou?"
        style={{
          width: "100%", padding: "12px 13px", borderRadius: 11, fontSize: 15,
          lineHeight: 1.45, resize: "none", fontFamily: "inherit",
          border: `1px solid ${over ? "#b91c1c" : dark ? "rgba(250,250,249,.22)" : "#e7e5e4"}`,
          background: dark ? "rgba(250,250,249,.06)" : "#fff",
          color: dark ? "#fafaf9" : "#1c1917",
        }}
      />
      <div style={{ fontSize: 11.5, textAlign: "right", marginTop: 4, color: over ? "#b91c1c" : dark ? "rgba(250,250,249,.45)" : "#a8a29e" }}>
        {used}/{NOTE_MAX_GRAPHEMES}
      </div>
    </div>
  );
}
