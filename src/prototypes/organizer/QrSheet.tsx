/**
 * PROTOTYPE — throwaway. The printable per-Event QR (ticket 06).
 *
 * The pattern is a deterministic stand-in, not a real QR — the question here is
 * what the sheet says and where it goes on the table, not the encoder.
 */
export function FakeQr({ code, size = 150 }: { code: string; size?: number }) {
  const n = 21;
  const cell = size / n;
  let h = 0;
  for (const ch of code) h = (h * 31 + ch.charCodeAt(0)) >>> 0;

  const cells: React.ReactElement[] = [];
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      const corner = (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
      const ring = corner && (x % 6 === 0 || y % 6 === 0 || (x > 1 && x < 5 && y > 1 && y < 5));
      const on = corner ? ring : ((h >> ((x * 7 + y * 13) % 30)) ^ (x * y)) % 3 === 0;
      if (on) cells.push(<rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill="#1c1917" />);
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <rect width={size} height={size} fill="#fff" />
      {cells}
    </svg>
  );
}

export function QrSheet({ code, eventName, date }: { code: string; eventName: string; date: string }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e7e5e4", borderRadius: 14,
      padding: "26px 22px", textAlign: "center", fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{ fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", color: "#a8544f" }}>
        Degustação
      </div>
      <div style={{ fontSize: 19, fontWeight: 700, margin: "8px 0 2px", color: "#1c1917" }}>
        {eventName || "Sem nome ainda"}
      </div>
      <div style={{ fontSize: 13, color: "#78716c" }}>{date || "Sem data ainda"}</div>

      <div style={{ display: "inline-block", margin: "18px 0 12px", padding: 10, border: "1px solid #e7e5e4", borderRadius: 10 }}>
        <FakeQr code={code} />
      </div>

      <div style={{ fontSize: 15, fontWeight: 700, color: "#1c1917" }}>
        Aponte a câmera para avaliar os vinhos
      </div>
      <div style={{ fontSize: 12.5, color: "#78716c", marginTop: 6, lineHeight: 1.5 }}>
        No fim da noite você leva suas impressões<br />prontas para postar.
      </div>
      <div style={{ fontSize: 11, color: "#a8a29e", marginTop: 14, fontFamily: "ui-monospace, monospace" }}>
        {code}
      </div>
    </div>
  );
}
