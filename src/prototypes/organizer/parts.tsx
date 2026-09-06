/** PROTOTYPE — throwaway. Shared Organizer pieces for ticket 06. */
import { useState } from "react";

export const O = {
  wine: "#7f1d1d", ink: "#1c1917", mut: "#78716c",
  line: "#e7e5e4", cream: "#faf7f2", ok: "#166534",
};

export function Passcode({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);
  const submit = () => (value.trim() === "1234" ? onUnlock() : setWrong(true));

  return (
    <div style={{ minHeight: "100vh", background: O.cream, display: "grid", placeItems: "center", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 320, textAlign: "center" }}>
        <div style={{ fontSize: 34 }}>🍷</div>
        <h1 style={{ fontSize: 21, margin: "12px 0 6px", color: O.ink }}>Área dos organizadores</h1>
        <p style={{ fontSize: 13.5, color: O.mut, margin: "0 0 22px", lineHeight: 1.5 }}>
          Digite a senha do grupo.
        </p>
        <input
          value={value} autoFocus inputMode="numeric"
          onChange={(e) => { setValue(e.target.value); setWrong(false); }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="senha"
          style={{
            width: "100%", padding: "14px 15px", fontSize: 17, textAlign: "center",
            borderRadius: 11, border: `1px solid ${wrong ? "#b91c1c" : O.line}`,
          }}
        />
        {wrong && <div style={{ fontSize: 12.5, color: "#b91c1c", marginTop: 8 }}>Senha incorreta.</div>}
        <button onClick={submit} style={{ width: "100%", marginTop: 14, padding: 15, borderRadius: 11, border: 0, background: O.wine, color: "#fff", fontSize: 15, fontWeight: 700 }}>
          Entrar
        </button>
        <div style={{ fontSize: 11.5, color: O.mut, marginTop: 16, lineHeight: 1.5 }}>
          protótipo: a senha é <code>1234</code>. Quanto tempo a sessão dura é o ticket 09.
        </div>
      </div>
    </div>
  );
}

export function Field({
  label, value, onChange, placeholder, wide,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; wide?: boolean;
}) {
  return (
    <label style={{ display: "block", gridColumn: wide ? "1 / -1" : undefined }}>
      <span style={{ display: "block", fontSize: 11.5, color: O.mut, marginBottom: 5 }}>{label}</span>
      <input
        value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "11px 12px", fontSize: 15, borderRadius: 9, border: `1px solid ${O.line}`, background: "#fff" }}
      />
    </label>
  );
}
