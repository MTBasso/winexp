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
import { ACHEI_SCALE, AXES } from "../taster/content";

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

// Heavy dark overlay stacked on top of a full-bleed bottle photo. Two layers:
// a top-darkening band (most bottle photos a user uploads are plain
// white-background studio shots, so without this the top of the Slide blows
// out) and a stronger bottom-darkening band (where the text content sits).
// Tuned against a plain white-background product photo, not just a dark one
// — a single bottom-fade left the white background reading as a washed-out,
// broken Slide.
const IMAGE_OVERLAY =
  "linear-gradient(to top, rgba(10,8,7,.94) 0%, rgba(10,8,7,.72) 24%, rgba(10,8,7,.3) 48%, rgba(10,8,7,.55) 72%, rgba(10,8,7,.88) 100%)";

const imageFrame = (imageUrl: string): React.CSSProperties => ({
  width: SLIDE_W,
  height: SLIDE_H,
  boxSizing: "border-box",
  position: "relative",
  overflow: "hidden",
  backgroundImage: `url(${imageUrl})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
});

const imageOverlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundImage: IMAGE_OVERLAY,
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
  impression, index, imageUrl,
}: {
  impression: Impression;
  index: number;
  /** A pre-decoded blob URL resolved by ShareCard, never the raw server URL —
   * never rendered via an `<img>` tag (see file header). */
  imageUrl?: string | undefined;
}) {
  const { pour, note, descriptors, ratings, achei } = impression;
  const answered = AXES.filter((a) => ratings[a.id]);
  const acheiLabel = ACHEI_SCALE.find((a) => a.value === achei)?.label;

  // On-dark text tones for the full-bleed treatment, matching the existing
  // light-on-dark palette already used elsewhere (RatingSheet.tsx, Deck.tsx).
  const textInk = imageUrl ? "#fafaf9" : INK;
  const textMuted = imageUrl ? "rgba(250,250,249,.78)" : MUTED;
  const textFaint = imageUrl ? "rgba(250,250,249,.58)" : FAINT;
  const dividerColor = imageUrl ? "rgba(250,250,249,.3)" : "#ddd2c4";

  const content = (
    <div style={inner}>
      <div style={{ fontFamily: SANS, fontSize: 26, letterSpacing: ".22em", textTransform: "uppercase", color: WINE }}>
        {String(index + 1).padStart(2, "0")}
        {pour.country ? ` · ${pour.country}` : ""}
      </div>

      <div style={{ fontFamily: SERIF, fontSize: pour.name.length > 22 ? 62 : 82, lineHeight: 1.1, color: textInk, marginTop: imageUrl ? 420 : 34 }}>
        {pour.name}
      </div>
      {(pour.producer || pour.vintage) && (
        <div style={{ fontFamily: SANS, fontSize: 32, color: textMuted, marginTop: 18 }}>
          {[pour.producer, pour.vintage].filter(Boolean).join(" · ")}
        </div>
      )}

      {(acheiLabel || answered.length > 0) && (
        <div style={{ borderTop: `2px solid ${dividerColor}`, marginTop: 54, paddingTop: 34, display: "grid", gap: 20 }}>
          {acheiLabel && (
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: SANS, fontSize: 27 }}>
              <span style={{ color: textFaint }}>O que achou?</span>
              <span style={{ color: textInk, fontWeight: 700 }}>{acheiLabel}</span>
            </div>
          )}
          {answered.map((axis) => (
            <div key={axis.id} style={{ display: "flex", justifyContent: "space-between", fontFamily: SANS, fontSize: 27 }}>
              <span style={{ color: textFaint }}>{axis.question}</span>
              <span style={{ color: textInk, fontWeight: 700 }}>
                {ratings[axis.id] === "high" ? axis.high : axis.low}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ flex: 1 }} />

      {note.trim() !== "" && (
        <div style={{ fontFamily: SERIF, fontSize: note.length > 90 ? 40 : 46, lineHeight: 1.35, color: textInk, fontStyle: "italic" }}>
          “{note}”
        </div>
      )}
      {descriptors.length > 0 && (
        <div style={{ fontFamily: SANS, fontSize: 26, color: WINE, marginTop: 30, letterSpacing: ".1em" }}>
          {descriptors.join("  ·  ").toUpperCase()}
        </div>
      )}
    </div>
  );

  if (imageUrl) {
    return (
      <div style={imageFrame(imageUrl)}>
        <div style={imageOverlay} />
        <div style={{ position: "relative", height: "100%" }}>{content}</div>
      </div>
    );
  }

  return <div style={frame}>{content}</div>;
}
