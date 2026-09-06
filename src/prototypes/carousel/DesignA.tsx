/** PROTOTYPE — A: Editorial. Paper ground, serif, the Note as a pull quote. */
import { EVENT, IMPRESSIONS, TASTER_NAME, AXIS_LIST } from "./slideData";
import { Slide, Strip, SERIF, SANS } from "./frame";

export const NAME_A = "Editorial";
const PAPER = "#f4efe6";
const INK = "#26201b";
const WINE = "#7f1d1d";

export function DesignA() {
  return (
    <Strip>
      <Slide bg={PAPER}>
        <div style={{ padding: 96, height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ fontFamily: SANS, fontSize: 30, letterSpacing: ".28em", textTransform: "uppercase", color: WINE }}>
            Degustação
          </div>
          <div>
            <div style={{ fontFamily: SERIF, fontSize: 104, lineHeight: 1.06, color: INK }}>{EVENT.name}</div>
            <div style={{ width: 150, height: 3, background: WINE, margin: "52px 0" }} />
            <div style={{ fontFamily: SANS, fontSize: 36, color: "#6b5f55", lineHeight: 1.5 }}>
              As impressões de {TASTER_NAME}<br />sobre {IMPRESSIONS.length} vinhos
            </div>
          </div>
          <div style={{ fontFamily: SANS, fontSize: 30, color: "#8a7c70" }}>{EVENT.date}</div>
        </div>
      </Slide>

      {IMPRESSIONS.map((imp, i) => (
        <Slide bg={PAPER} key={imp.pour.id}>
          <div style={{ padding: 96, height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: SANS, fontSize: 26, letterSpacing: ".22em", textTransform: "uppercase", color: WINE }}>
              {String(i + 1).padStart(2, "0")} · {imp.pour.country}
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 82, lineHeight: 1.1, color: INK, marginTop: 34 }}>
              {imp.pour.name}
            </div>
            <div style={{ fontFamily: SANS, fontSize: 32, color: "#6b5f55", marginTop: 18 }}>
              {imp.pour.producer} · {imp.pour.vintage}
            </div>

            <div style={{ borderTop: `2px solid #ddd2c4`, marginTop: 54, paddingTop: 34, display: "grid", gap: 20 }}>
              {AXIS_LIST.map((a) => (
                <div key={a.id} style={{ display: "flex", justifyContent: "space-between", fontFamily: SANS, fontSize: 27 }}>
                  <span style={{ color: "#8a7c70" }}>{a.question}</span>
                  <span style={{ color: INK, fontWeight: 700 }}>{imp.answers[a.id]}</span>
                </div>
              ))}
            </div>

            <div style={{ flex: 1 }} />
            <div style={{ fontFamily: SERIF, fontSize: 46, lineHeight: 1.35, color: INK, fontStyle: "italic" }}>
              “{imp.note}”
            </div>
            <div style={{ fontFamily: SANS, fontSize: 26, color: WINE, marginTop: 30, letterSpacing: ".1em" }}>
              {imp.descriptors.join("  ·  ").toUpperCase()}
            </div>
          </div>
        </Slide>
      ))}
    </Strip>
  );
}
