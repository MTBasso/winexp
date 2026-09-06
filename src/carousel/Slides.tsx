/**
 * The Carousel Slides: Editorial (ticket 08).
 *
 * Rendered as ordinary React/CSS in the live DOM and captured with snapdom
 * (ticket 02). Three constraints are load-bearing and easy to break:
 *
 *   - Every container sets `boxSizing` explicitly. Capture serialises this
 *     subtree, so a Slide that relies on an ambient stylesheet renders
 *     correctly on screen and CLIPS in the saved image.
 *   - No <img> anywhere. Every raster image is a WebKit decode race.
 *   - System font stacks only, so nothing depends on a webfont having loaded
 *     when the capture runs.
 */
import type { Impression } from "../domain/types";
import { AXES } from "../taster/content";

export const SLIDE_W = 1080;
export const SLIDE_H = 1350;

const PAPER = "#f4efe6";
const INK = "#26201b";
const WINE = "#7f1d1d";
const MUTED = "#6b5f55";
const FAINT = "#8a7c70";

const SERIF = 'Georgia, "Times New Roman", "Noto Serif", serif';
const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

const frame: React.CSSProperties = {
  width: SLIDE_W,
  height: SLIDE_H,
  boxSizing: "border-box",
  background: PAPER,
  overflow: "hidden",
  position: "relative",
};

const inner: React.CSSProperties = {
  height: "100%",
  boxSizing: "border-box",
  padding: 96,
  display: "flex",
  flexDirection: "column",
};

export function CoverSlide({
  eventName, date, firstName, count,
}: {
  eventName: string;
  date: string;
  firstName: string | null;
  count: number;
}) {
  return (
    <div style={frame}>
      <div style={{ ...inner, justifyContent: "space-between" }}>
        <div style={{ fontFamily: SANS, fontSize: 30, letterSpacing: ".28em", textTransform: "uppercase", color: WINE }}>
          Degustação
        </div>
        <div>
          <div style={{ fontFamily: SERIF, fontSize: eventName.length > 26 ? 78 : 104, lineHeight: 1.06, color: INK }}>
            {eventName}
          </div>
          <div style={{ width: 150, height: 3, background: WINE, margin: "52px 0" }} />
          <div style={{ fontFamily: SANS, fontSize: 36, color: MUTED, lineHeight: 1.5 }}>
            {firstName ? `As impressões de ${firstName}` : "Minhas impressões"}
            <br />
            sobre {count} {count === 1 ? "vinho" : "vinhos"}
          </div>
        </div>
        <div style={{ fontFamily: SANS, fontSize: 30, color: FAINT }}>{date}</div>
      </div>
    </div>
  );
}

export function PourSlide({
  impression, index,
}: {
  impression: Impression;
  index: number;
}) {
  const { pour, note, descriptors, ratings } = impression;
  const answered = AXES.filter((a) => ratings[a.id]);

  return (
    <div style={frame}>
      <div style={inner}>
        <div style={{ fontFamily: SANS, fontSize: 26, letterSpacing: ".22em", textTransform: "uppercase", color: WINE }}>
          {String(index + 1).padStart(2, "0")}
          {pour.country ? ` · ${pour.country}` : ""}
        </div>

        <div style={{ fontFamily: SERIF, fontSize: pour.name.length > 22 ? 62 : 82, lineHeight: 1.1, color: INK, marginTop: 34 }}>
          {pour.name}
        </div>
        {(pour.producer || pour.vintage) && (
          <div style={{ fontFamily: SANS, fontSize: 32, color: MUTED, marginTop: 18 }}>
            {[pour.producer, pour.vintage].filter(Boolean).join(" · ")}
          </div>
        )}

        {answered.length > 0 && (
          <div style={{ borderTop: "2px solid #ddd2c4", marginTop: 54, paddingTop: 34, display: "grid", gap: 20 }}>
            {answered.map((axis) => (
              <div key={axis.id} style={{ display: "flex", justifyContent: "space-between", fontFamily: SANS, fontSize: 27 }}>
                <span style={{ color: FAINT }}>{axis.question}</span>
                <span style={{ color: INK, fontWeight: 700 }}>
                  {ratings[axis.id] === "high" ? axis.high : axis.low}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {note.trim() !== "" && (
          <div style={{ fontFamily: SERIF, fontSize: note.length > 90 ? 40 : 46, lineHeight: 1.35, color: INK, fontStyle: "italic" }}>
            “{note}”
          </div>
        )}
        {descriptors.length > 0 && (
          <div style={{ fontFamily: SANS, fontSize: 26, color: WINE, marginTop: 30, letterSpacing: ".1em" }}>
            {descriptors.join("  ·  ").toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}
