/** PROTOTYPE — C: Declaração. The Note is the design; data shrinks to a footer. */
import { EVENT, IMPRESSIONS, TASTER_NAME } from "./slideData";
import { Slide, Strip, SANS } from "./frame";

export const NAME_C = "Declaração";

/** One accent per Slide, derived from position so it is stable and vector-only. */
const ACCENTS = ["#7f1d1d", "#1e3a2b", "#3b2f6b", "#8a4b12", "#0f3b47", "#6b1145"];

export function DesignC() {
  return (
    <Strip>
      <Slide bg="#0d0b0a">
        <div style={{ padding: 96, height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div style={{ fontFamily: SANS, fontSize: 132, fontWeight: 900, lineHeight: 1.02, color: "#fff", letterSpacing: "-.03em" }}>
            Bebi<br />{IMPRESSIONS.length} vinhos<br />e anotei<br />tudo.
          </div>
          <div style={{ fontFamily: SANS, fontSize: 30, color: "rgba(255,255,255,.55)", marginTop: 56, lineHeight: 1.6 }}>
            {EVENT.name} · {EVENT.date}<br />{TASTER_NAME}
          </div>
        </div>
      </Slide>

      {IMPRESSIONS.map((imp, i) => {
        const accent = ACCENTS[i % ACCENTS.length]!;
        return (
          <Slide bg={accent} key={imp.pour.id}>
            <div style={{ padding: 96, height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ fontFamily: SANS, fontSize: 30, fontWeight: 700, letterSpacing: ".2em", color: "rgba(255,255,255,.6)" }}>
                {String(i + 1).padStart(2, "0")} / {String(IMPRESSIONS.length).padStart(2, "0")}
              </div>

              <div style={{ fontFamily: SANS, fontSize: imp.note.length > 62 ? 78 : 96, fontWeight: 800, lineHeight: 1.13, color: "#fff", letterSpacing: "-.02em" }}>
                {imp.note}
              </div>

              <div>
                <div style={{ height: 2, background: "rgba(255,255,255,.28)", marginBottom: 34 }} />
                <div style={{ fontFamily: SANS, fontSize: 44, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
                  {imp.pour.name}
                </div>
                <div style={{ fontFamily: SANS, fontSize: 28, color: "rgba(255,255,255,.65)", marginTop: 10 }}>
                  {imp.pour.producer} · {imp.pour.vintage} · {imp.pour.country}
                </div>
                <div style={{ fontFamily: SANS, fontSize: 26, color: "rgba(255,255,255,.5)", marginTop: 20 }}>
                  {Object.values(imp.answers).join(" · ")}
                  {imp.descriptors.length > 0 && `  ·  ${imp.descriptors.join(", ")}`}
                </div>
              </div>
            </div>
          </Slide>
        );
      })}
    </Strip>
  );
}
