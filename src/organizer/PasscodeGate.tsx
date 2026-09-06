/**
 * Asked once per device, then never again (ticket 09 amendment).
 *
 * The passcode protects writes, not secrets — so the goal is that an Organizer
 * experiences no login at all after the first time.
 */
import { useEffect, useState } from "react";
import { checkPasscode, getPasscode, setPasscode } from "../api/client";

export function PasscodeGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"checking" | "locked" | "open">("checking");
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!getPasscode()) {
      setStatus("locked");
      return;
    }
    void checkPasscode().then((ok) => setStatus(ok ? "open" : "locked"));
  }, []);

  const submit = async () => {
    if (!value.trim()) return;
    setBusy(true);
    setPasscode(value.trim());
    const ok = await checkPasscode();
    setBusy(false);
    if (ok) setStatus("open");
    else setWrong(true);
  };

  if (status === "checking") return <div style={centre}>…</div>;
  if (status === "open") return <>{children}</>;

  return (
    <div style={{ ...centre, padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 320, textAlign: "center" }}>
        <div style={{ fontSize: 34 }}>🍷</div>
        <h1 style={{ fontSize: 21, margin: "12px 0 6px", color: "#1c1917" }}>
          Área dos organizadores
        </h1>
        <p style={{ fontSize: 13.5, color: "#78716c", margin: "0 0 22px", lineHeight: 1.5 }}>
          Digite a senha do grupo. Só desta vez neste aparelho.
        </p>
        <input
          value={value}
          autoFocus
          onChange={(e) => {
            setValue(e.target.value);
            setWrong(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && void submit()}
          placeholder="senha"
          style={{
            width: "100%", padding: "14px 15px", fontSize: 17, textAlign: "center",
            borderRadius: 11, border: `1px solid ${wrong ? "#b91c1c" : "#e7e5e4"}`,
          }}
        />
        {wrong && <div style={{ fontSize: 12.5, color: "#b91c1c", marginTop: 8 }}>Senha incorreta.</div>}
        <button
          onClick={() => void submit()}
          disabled={busy}
          style={{
            width: "100%", marginTop: 14, padding: 15, borderRadius: 11, border: 0,
            background: "#7f1d1d", color: "#fff", fontSize: 15, fontWeight: 700,
          }}
        >
          {busy ? "Verificando…" : "Entrar"}
        </button>
      </div>
    </div>
  );
}

const centre: React.CSSProperties = {
  minHeight: "100vh", background: "#faf7f2",
  display: "grid", placeItems: "center", fontFamily: "system-ui, sans-serif",
};
