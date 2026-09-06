/** PROTOTYPE — B: Ficha. Dark tasting card; the four Axes as visible structure. */
import { EVENT, IMPRESSIONS, TASTER_NAME, AXIS_LIST } from "./slideData";
import { Slide, Strip, SANS } from "./frame";

export const NAME_B = "Ficha";
const DARK = "#171310";
const GOLD = "#c8a24a";
const CREAM = "#efe9e0";

export function DesignB() {
  return (
    <Strip>
      <Slide bg={DARK}>
        <div style={{ position: "absolute", inset: 54, border: `2px solid ${GOLD}` }} />
        <div style={{ padding: 128, height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center", position: "relative" }}>
          <div style={{ fontFamily: SANS, fontSize: 28, letterSpacing: ".34em", textTransform: "uppercase", color: GOLD }}>
            Ficha de degustação
          </div>
          <div style={{ fontFamily: SANS, fontSize: 88, fontWeight: 800, lineHeight: 1.12, color: CREAM, margin: "48px 0 30px" }}>
            {EVENT.name}
          </div>
          <div style={{ fontFamily: SANS, fontSize: 32, color: "rgba(239,233,224,.6)", lineHeight: 1.6 }}>
            {EVENT.date}<br />por {TASTER_NAME}
          </div>
          <div style={{ marginTop: 62, fontFamily: SANS, fontSize: 150, fontWeight: 800, color: GOLD, lineHeight: 1 }}>
            {IMPRESSIONS.length}
          </div>
          <div style={{ fontFamily: SANS, fontSize: 27, letterSpacing: ".2em", textTransform: "uppercase", color: "rgba(239,233,224,.5)", marginTop: 8 }}>
            vinhos avaliados
          </div>
        </div>
      </Slide>

      {IMPRESSIONS.map((imp, i) => (
        <Slide bg={DARK} key={imp.pour.id}>
          <div style={{ padding: 86, height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <span style={{ fontFamily: SANS, fontSize: 120, fontWeight: 800, color: GOLD, lineHeight: 1 }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span style={{ fontFamily: SANS, fontSize: 26, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(239,233,224,.5)" }}>
                {imp.pour.country} · {imp.pour.vintage}
              </span>
            </div>

            <div style={{ fontFamily: SANS, fontSize: 66, fontWeight: 800, lineHeight: 1.14, color: CREAM, marginTop: 30 }}>
              {imp.pour.name}
            </div>
            <div style={{ fontFamily: SANS, fontSize: 30, color: GOLD, marginTop: 12 }}>{imp.pour.producer}</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 48 }}>
              {AXIS_LIST.map((a) => (
                <div key={a.id} style={{ background: "rgba(239,233,224,.06)", border: "1px solid rgba(239,233,224,.12)", borderRadius: 16, padding: "22px 24px" }}>
                  <div style={{ fontFamily: SANS, fontSize: 21, color: "rgba(239,233,224,.5)", lineHeight: 1.3 }}>{a.question}</div>
                  <div style={{ fontFamily: SANS, fontSize: 31, fontWeight: 700, color: CREAM, marginTop: 10 }}>{imp.answers[a.id]}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 34 }}>
              {imp.descriptors.map((d) => (
                <span key={d} style={{ fontFamily: SANS, fontSize: 25, color: DARK, background: GOLD, borderRadius: 999, padding: "12px 24px", fontWeight: 600 }}>
                  {d}
                </span>
              ))}
            </div>

            <div style={{ flex: 1 }} />
            <div style={{ borderLeft: `4px solid ${GOLD}`, paddingLeft: 30, fontFamily: SANS, fontSize: 36, lineHeight: 1.42, color: "rgba(239,233,224,.9)" }}>
              {imp.note}
            </div>
          </div>
        </Slide>
      ))}
    </Strip>
  );
}
