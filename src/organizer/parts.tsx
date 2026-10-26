/** Shared Organizer UI. */
import type { SaveState } from "./useAutosave";

export const O = {
  wine: "#7f1d1d", ink: "#1c1917", mut: "#78716c",
  line: "#e7e5e4", cream: "#faf7f2",
};

export function Field({
  label, value, onChange, placeholder, wide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  wide?: boolean;
}) {
  return (
    <label style={{ display: "block", gridColumn: wide ? "1 / -1" : undefined }}>
      <span style={{ display: "block", fontSize: 11.5, color: O.mut, marginBottom: 5 }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "11px 12px", fontSize: 15,
          borderRadius: 9, border: `1px solid ${O.line}`, background: "#fff",
        }}
      />
    </label>
  );
}

export function Select<T extends string>({
  label, value, onChange, options, wide,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly { value: T; label: string }[];
  wide?: boolean;
}) {
  return (
    <label style={{ display: "block", gridColumn: wide ? "1 / -1" : undefined }}>
      <span style={{ display: "block", fontSize: 11.5, color: O.mut, marginBottom: 5 }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        style={{
          width: "100%", padding: "11px 12px", fontSize: 15,
          borderRadius: 9, border: `1px solid ${O.line}`, background: "#fff",
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  );
}

/**
 * An Organizer at a venue needs to know their list is safe, so saving is a
 * visible state — including when it fails.
 */
export function SaveBadge({ lineup, meta }: { lineup: SaveState; meta: SaveState }) {
  const failed =
    lineup.status === "failed" ? lineup : meta.status === "failed" ? meta : null;
  const saving = lineup.status === "saving" || meta.status === "saving";
  const saved = lineup.status === "saved" || meta.status === "saved";

  if (failed) {
    return (
      <div style={{ ...badge, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c" }}>
        Não salvou: {failed.message}. Vai tentar de novo na próxima edição.
      </div>
    );
  }
  if (saving) return <div style={{ ...badge, color: O.mut }}>Salvando…</div>;
  if (saved) return <div style={{ ...badge, color: "#166534" }}>Salvo automaticamente</div>;
  return <div style={{ ...badge, color: O.mut }}>Tudo é salvo automaticamente</div>;
}

const badge: React.CSSProperties = {
  fontSize: 12, padding: "7px 10px", borderRadius: 8, display: "inline-block",
};
