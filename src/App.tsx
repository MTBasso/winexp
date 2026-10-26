import { useState } from "react";
import { PasscodeGate } from "./organizer/PasscodeGate";
import { OrganizerAdmin } from "./organizer/OrganizerAdmin";
import { TasterApp } from "./taster/TasterApp";
import { isValidEventCode, normaliseEventCode } from "./domain/eventCode";

/**
 * Two surfaces: where a QR scan lands, and the Organizer admin.
 *
 * The throwaway prototypes that settled tickets 04, 06, 07, 08 and 13 are not
 * here — they were folded into production code, and the full sets are preserved
 * on the prototype/* branches.
 */
export function App() {
  const path = window.location.pathname;

  // Where a QR scan lands (tickets 04, 07, 18).
  const scanned = path.match(/^\/e\/([^/]+)\/?$/);
  if (scanned) return <TasterApp rawCode={scanned[1]!} />;

  // The Organizer admin (tickets 06, 09, 17).
  if (path === "/admin") {
    return (
      <PasscodeGate>
        <OrganizerAdmin />
      </PasscodeGate>
    );
  }

  return <Landing />;
}

function Landing() {
  const [code, setCode] = useState("");
  const [invalid, setInvalid] = useState(false);

  const go = () => {
    if (!isValidEventCode(code)) {
      setInvalid(true);
      return;
    }
    window.location.href = `/e/${normaliseEventCode(code)}`;
  };

  return (
    <main style={page}>
      <div style={{ fontSize: 46, marginBottom: 14 }}>🍷</div>
      <h1 style={{ fontSize: 26, margin: "0 0 12px", color: "#1c1917" }}>Degustação</h1>
      <p style={{ color: "#57534e", fontSize: 15.5, lineHeight: 1.6, margin: "0 0 28px" }}>
        Escaneie o QR code na sua mesa para avaliar os vinhos da noite e sair
        com suas impressões prontas para postar.
      </p>
      <p style={{ color: "#78716c", fontSize: 13.5, lineHeight: 1.6, margin: "0 0 28px" }}>
        Sem cadastro e sem senha. Suas avaliações ficam só no seu aparelho.
      </p>

      <div style={codeBox}>
        <p style={{ color: "#78716c", fontSize: 13, lineHeight: 1.5, margin: "0 0 10px" }}>
          Tem só o código da mesa?
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setInvalid(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && go()}
            placeholder="Código"
            style={codeInput}
          />
          <button onClick={go} style={codeBtn}>Entrar</button>
        </div>
        {invalid && (
          <p style={{ color: "#b91c1c", fontSize: 12.5, margin: "8px 0 0" }}>
            Código inválido. Confira os seis caracteres.
          </p>
        )}
      </div>

      <a href="/admin" style={adminLink}>Sou organizador</a>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh", maxWidth: 460, margin: "0 auto",
  padding: "72px 24px 40px", fontFamily: "system-ui, sans-serif",
  textAlign: "center", background: "#faf7f2",
};
const adminLink: React.CSSProperties = {
  display: "inline-block", marginTop: 32, fontSize: 13, color: "#a8544f",
  textDecoration: "none", borderBottom: "1px solid rgba(168,84,79,.35)", paddingBottom: 2,
};
const codeBox: React.CSSProperties = {
  padding: "16px 18px", borderRadius: 14, background: "#fff",
  border: "1px solid #e7e5e4", textAlign: "left",
};
const codeInput: React.CSSProperties = {
  flex: 1, padding: "12px 13px", fontSize: 15, borderRadius: 9,
  border: "1px solid #e7e5e4", background: "#faf7f2",
  textTransform: "uppercase", letterSpacing: ".06em",
};
const codeBtn: React.CSSProperties = {
  padding: "12px 18px", borderRadius: 9, border: 0,
  background: "#7f1d1d", color: "#fff", fontSize: 14, fontWeight: 700,
};
