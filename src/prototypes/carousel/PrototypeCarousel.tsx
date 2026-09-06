/**
 * PROTOTYPE — throwaway. The Carousel settled by ticket 08: Editorial.
 *
 * Slides render at true 1080x1350 and are scaled for preview, so the type sizes
 * on screen are the real ones. Constraints fixed by research: JPEG at
 * 1080x1350, at most 10 files (Chromium binds before Instagram), no raster
 * images anywhere, self-hosted fonts only.
 *
 * The rejected designs (Ficha, Declaração) live on the
 * prototype/rejected-variants branch.
 */
import { DesignA } from "./DesignA";
import { IMPRESSIONS } from "./slideData";

export function PrototypeCarousel() {
  return (
    <div style={{ background: "#e7e5e4", minHeight: "100vh", paddingTop: 18, paddingBottom: 40 }}>
      <div style={{ padding: "0 18px 14px", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#1c1917" }}>Carrossel · Editorial</div>
        <div style={{ fontSize: 12.5, color: "#57534e", marginTop: 4, lineHeight: 1.5 }}>
          Capa + {IMPRESSIONS.length} vinhos avaliados = {IMPRESSIONS.length + 1} slides.
          Role de lado. Cada slide é 1080×1350 real, reduzido para caber.
        </div>
      </div>

      <DesignA />

      <div style={{ padding: "10px 18px", fontFamily: "system-ui, sans-serif", fontSize: 12, color: "#78716c", lineHeight: 1.6 }}>
        Um vinho não avaliado não vira slide. Máximo de 10 arquivos: acima de
        nove avaliados a capa cai fora.
      </div>
    </div>
  );
}
