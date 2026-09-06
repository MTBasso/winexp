/**
 * PROTOTYPE — throwaway. Ticket 08: three Carousel designs at
 * /prototype/carousel?variant=A|B|C.
 *
 * Slides render at true 1080x1350 and are scaled down for preview, so type
 * sizes are the real ones. Constraints already fixed by research: JPEG at
 * 1080x1350, at most 10 Slides (Chromium binds before Instagram), no raster
 * images anywhere, self-hosted fonts only.
 */
import { useCallback, useState } from "react";
import { PrototypeSwitcher } from "../PrototypeSwitcher";
import { DesignA, NAME_A } from "./DesignA";
import { DesignB, NAME_B } from "./DesignB";
import { DesignC, NAME_C } from "./DesignC";
import { IMPRESSIONS } from "./slideData";

const VARIANTS = ["A", "B", "C"] as const;
const NAMES = { A: NAME_A, B: NAME_B, C: NAME_C };

export function PrototypeCarousel() {
  const [variant, setVariant] = useState(
    () => new URLSearchParams(window.location.search).get("variant") ?? "A",
  );

  const change = useCallback((v: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("variant", v);
    window.history.replaceState(null, "", url);
    setVariant(v);
  }, []);

  return (
    <div style={{ background: "#e7e5e4", minHeight: "100vh", paddingTop: 18, paddingBottom: 90 }}>
      <div style={{ padding: "0 18px 14px", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#1c1917" }}>
          Carrossel · {NAMES[variant as keyof typeof NAMES] ?? ""}
        </div>
        <div style={{ fontSize: 12.5, color: "#57534e", marginTop: 4, lineHeight: 1.5 }}>
          Capa + {IMPRESSIONS.length} vinhos avaliados = {IMPRESSIONS.length + 1} slides.
          Role de lado. Cada slide é 1080×1350 real, reduzido para caber.
        </div>
      </div>

      {variant === "B" ? <DesignB /> : variant === "C" ? <DesignC /> : <DesignA />}

      <div style={{ padding: "10px 18px", fontFamily: "system-ui, sans-serif", fontSize: 12, color: "#78716c", lineHeight: 1.6 }}>
        Um vinho não avaliado não vira slide. Com mais de 9 avaliados o carrossel
        estoura o limite do Chromium — ticket 08 decide o que cede.
      </div>

      <PrototypeSwitcher variants={VARIANTS} current={variant} onChange={change} names={NAMES} />
    </div>
  );
}
