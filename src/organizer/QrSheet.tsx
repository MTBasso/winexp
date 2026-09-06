/**
 * The printable per-Event sheet (ticket 06).
 *
 * Printing is the point: the sheet goes on the table. The print stylesheet
 * strips everything else on the page.
 */
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrSheet({ code, name, date }: { code: string; name: string; date: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const url = `${window.location.origin}/e/${code}`;

  useEffect(() => {
    let live = true;
    void QRCode.toDataURL(url, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 640,
      color: { dark: "#1c1917", light: "#ffffff" },
    }).then((d) => live && setDataUrl(d));
    return () => {
      live = false;
    };
  }, [url]);

  return (
    <div className="qr-sheet" style={sheet}>
      <div style={{ fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", color: "#a8544f" }}>
        Degustação
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, margin: "8px 0 2px", color: "#1c1917" }}>{name}</div>
      <div style={{ fontSize: 13, color: "#78716c" }}>{date}</div>

      <div style={{ display: "inline-block", margin: "18px 0 12px", padding: 10, border: "1px solid #e7e5e4", borderRadius: 10 }}>
        {dataUrl ? (
          <img src={dataUrl} alt={`QR code ${code}`} width={190} height={190} style={{ display: "block" }} />
        ) : (
          <div style={{ width: 190, height: 190, display: "grid", placeItems: "center", color: "#a8a29e", fontSize: 12 }}>
            gerando…
          </div>
        )}
      </div>

      <div style={{ fontSize: 15, fontWeight: 700, color: "#1c1917" }}>
        Aponte a câmera para avaliar os vinhos
      </div>
      <div style={{ fontSize: 12.5, color: "#78716c", marginTop: 6, lineHeight: 1.5 }}>
        No fim da noite você leva suas impressões prontas para postar.
      </div>
      <div style={{ fontSize: 12, color: "#57534e", marginTop: 16, lineHeight: 1.6 }}>
        Ou digite <strong style={{ fontFamily: "ui-monospace, monospace", fontSize: 15, letterSpacing: ".1em" }}>{code}</strong>
        <br />
        <span style={{ fontSize: 11, color: "#a8a29e" }}>{url}</span>
      </div>
    </div>
  );
}

const sheet: React.CSSProperties = {
  background: "#fff", border: "1px solid #e7e5e4", borderRadius: 14,
  padding: "26px 22px", textAlign: "center", fontFamily: "system-ui, sans-serif",
};
