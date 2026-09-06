/** PROTOTYPE — throwaway. Hidden in production builds. */
import { useEffect } from "react";

export function PrototypeSwitcher({
  variants,
  current,
  onChange,
  names,
}: {
  variants: readonly string[];
  current: string;
  onChange: (v: string) => void;
  names: Readonly<Record<string, string>>;
}) {
  const index = Math.max(0, variants.indexOf(current));
  const go = (delta: number) => {
    const next = variants[(index + delta + variants.length) % variants.length];
    if (next) onChange(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable);
      if (typing) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (import.meta.env.PROD) return null;

  return (
    <div style={bar}>
      <button onClick={() => go(-1)} style={arrow} aria-label="Anterior">←</button>
      <span style={label}>
        {current} — {names[current] ?? ""}
      </span>
      <button onClick={() => go(1)} style={arrow} aria-label="Próximo">→</button>
    </div>
  );
}

const bar: React.CSSProperties = {
  position: "fixed",
  bottom: 14,
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  alignItems: "center",
  gap: 4,
  background: "#0c0a09",
  color: "#fafaf9",
  borderRadius: 999,
  padding: "6px 8px",
  boxShadow: "0 6px 24px rgba(0,0,0,.35)",
  zIndex: 9999,
  fontFamily: "ui-monospace, monospace",
  fontSize: 12,
};
const arrow: React.CSSProperties = {
  background: "transparent", border: 0, color: "#fafaf9",
  fontSize: 16, padding: "2px 10px", cursor: "pointer",
};
const label: React.CSSProperties = { padding: "0 6px", whiteSpace: "nowrap" };
