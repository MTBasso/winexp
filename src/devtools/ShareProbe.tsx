import { useCallback, useRef, useState } from "react";
import {
  checkShareLimits,
  formatBytes,
  CHROMIUM_MAX_FILES,
} from "../share/limits";
import {
  renderPlaceholderCarousel,
  SLIDE_HEIGHT,
  SLIDE_WIDTH,
  type PlaceholderSlide,
} from "./placeholderSlides";

/**
 * Ticket 13: verify multi-file share behaviour on real devices.
 *
 * A phone has no devtools worth the name, so every observation prints to the
 * page. Deploy this, open it on an iPhone and an Android phone, and record what
 * you see on the ticket.
 */

type LogKind = "info" | "good" | "bad";
interface LogLine {
  readonly at: string;
  readonly kind: LogKind;
  readonly text: string;
}

export function ShareProbe() {
  const [count, setCount] = useState(7);
  const [slides, setSlides] = useState<PlaceholderSlide[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState<LogLine[]>([]);
  const renderedForCount = useRef<number | null>(null);

  const say = useCallback((kind: LogKind, text: string) => {
    setLog((prev) => [
      ...prev,
      { at: new Date().toLocaleTimeString(), kind, text },
    ]);
  }, []);

  const render = useCallback(async () => {
    setBusy(true);
    setProgress(0);
    setSlides([]);
    renderedForCount.current = null;
    say("info", `Rendering ${count} Slides at ${SLIDE_WIDTH}x${SLIDE_HEIGHT}…`);

    const startedAt = performance.now();
    try {
      const rendered = await renderPlaceholderCarousel(count, setProgress);
      const totalMs = performance.now() - startedAt;
      const slowest = Math.max(...rendered.map((s) => s.renderMs));
      const report = checkShareLimits(rendered.map((s) => s.file));

      setSlides(rendered);
      renderedForCount.current = count;

      say(
        "good",
        `Rendered ${rendered.length} Slides in ${totalMs.toFixed(0)}ms ` +
          `(slowest ${slowest.toFixed(0)}ms, total ${formatBytes(report.totalBytes)})`,
      );
      if (report.exceedsFileCount) {
        say(
          "bad",
          `${report.fileCount} files is past Chromium's cap of ${CHROMIUM_MAX_FILES} — ` +
            `expect NotAllowedError on Android, and no error on iOS.`,
        );
      }
      if (report.exceedsTotalBytes) {
        say("bad", `Over Chromium's 50 MiB total budget.`);
      }
    } catch (error) {
      say("bad", `Render failed: ${describe(error)}`);
    } finally {
      setBusy(false);
    }
  }, [count, say]);

  // ADR-0004: the share handler contains the share() call and nothing else.
  // Transient activation lasts 5s and is consumed by share(); rendering here
  // would blow it. Slides must already exist before this runs.
  const share = useCallback(async () => {
    const files = slides.map((s) => s.file);
    if (files.length === 0) {
      say("bad", "Nothing rendered yet — render first, then share.");
      return;
    }

    const data: ShareData = { files };
    const canShare = navigator.canShare?.(data);
    say(
      "info",
      `navigator.share ${typeof navigator.share === "function" ? "present" : "MISSING"}; ` +
        `canShare(files) → ${String(canShare)} (it only checks the array is non-empty)`,
    );

    if (typeof navigator.share !== "function") {
      say(
        "bad",
        "No Web Share API. Android WebView has none — are you in an in-app browser?",
      );
      return;
    }

    const startedAt = performance.now();
    try {
      await navigator.share(data);
      say(
        "good",
        `share() resolved after ${(performance.now() - startedAt).toFixed(0)}ms. ` +
          `Resolution does NOT mean it posted — record what the sheet offered.`,
      );
    } catch (error) {
      const name = error instanceof Error ? error.name : "unknown";
      say(
        name === "AbortError" ? "info" : "bad",
        `share() threw ${describe(error)}` +
          (name === "AbortError" ? " (you dismissed the sheet — that's fine)" : ""),
      );
    }
  }, [slides, say]);

  const stale =
    renderedForCount.current !== null && renderedForCount.current !== count;

  return (
    <main style={S.page}>
      <h1 style={S.h1}>Share probe</h1>
      <p style={S.sub}>
        Ticket 13. Placeholder Slides only — this tests the share, not the
        design. Watch whether Instagram appears, and whether saving keeps the
        Slides in order.
      </p>

      <label style={S.label}>
        Slides: <strong>{count}</strong>
        <input
          type="range"
          min={1}
          max={12}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          style={S.range}
        />
        <span style={S.hint}>
          Try 7 (realistic), 10 (Chromium's cap), 11 (past it).
        </span>
      </label>

      <div style={S.row}>
        <button onClick={render} disabled={busy} style={S.btn}>
          {busy ? `Rendering ${progress}/${count}…` : "1 · Render Slides"}
        </button>
        <button
          onClick={share}
          disabled={busy || slides.length === 0}
          style={{
            ...S.btn,
            ...(slides.length > 0 && !stale ? S.btnPrimary : {}),
          }}
        >
          2 · Share {slides.length > 0 ? `(${slides.length})` : ""}
        </button>
      </div>

      {stale && (
        <p style={S.warn}>
          Slide count changed since rendering — re-render before sharing.
        </p>
      )}

      {slides.length > 0 && (
        <div style={S.thumbs}>
          {slides.map((s, i) => (
            <img
              key={s.file.name}
              src={URL.createObjectURL(s.file)}
              alt={`Slide ${i + 1}`}
              style={S.thumb}
            />
          ))}
        </div>
      )}

      <pre style={S.log}>
        {log.length === 0
          ? "Observations appear here."
          : log
              .map((l) => `${l.at}  ${prefix(l.kind)} ${l.text}`)
              .join("\n\n")}
      </pre>

      <details style={S.details}>
        <summary>Device</summary>
        <pre style={S.ua}>{navigator.userAgent}</pre>
      </details>
    </main>
  );
}

const prefix = (kind: LogKind) =>
  kind === "good" ? "[ok] " : kind === "bad" ? "[!!] " : "[--] ";

function describe(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

const S: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 560,
    margin: "0 auto",
    padding: "24px 16px 64px",
    fontFamily: "system-ui, sans-serif",
    color: "#1c1917",
  },
  h1: { fontSize: 22, margin: "0 0 6px" },
  sub: { fontSize: 14, lineHeight: 1.5, color: "#57534e", margin: "0 0 22px" },
  label: { display: "block", fontSize: 14, marginBottom: 18 },
  range: { display: "block", width: "100%", margin: "10px 0 4px" },
  hint: { fontSize: 12, color: "#78716c" },
  row: { display: "flex", gap: 10, marginBottom: 14 },
  btn: {
    flex: 1,
    padding: "14px 12px",
    fontSize: 15,
    fontWeight: 600,
    borderRadius: 10,
    border: "1px solid #d6d3d1",
    background: "#fff",
    color: "#1c1917",
  },
  btnPrimary: { background: "#7f1d1d", borderColor: "#7f1d1d", color: "#fff" },
  warn: { fontSize: 13, color: "#9a3412", margin: "0 0 14px" },
  thumbs: { display: "flex", gap: 6, overflowX: "auto", marginBottom: 16 },
  thumb: { height: 90, borderRadius: 6, flex: "0 0 auto" },
  log: {
    background: "#1c1917",
    color: "#e7e5e4",
    padding: 14,
    borderRadius: 10,
    fontSize: 12,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    minHeight: 120,
  },
  details: { marginTop: 16, fontSize: 12, color: "#78716c" },
  ua: { whiteSpace: "pre-wrap", fontSize: 11, marginTop: 8 },
};
